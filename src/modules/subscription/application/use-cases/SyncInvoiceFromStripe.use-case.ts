import { Injectable } from "@nestjs/common";
import { BaseUseCase, DomainError, IUseCase } from "src/core";
import type { ILoggerService, IEventStore } from "src/core";
import type { IInvoiceRepository } from "../../domain/repositories/invoice.repository";
import type { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import type { ISubscriptionPlanRepository } from "../../domain/repositories/subscription-plan.repository";
import { InvoiceEntity } from "../../domain/entities/invoice.entity";
import type { IStripeSyncService } from "../../../payment/domain/services/stripe-sync.service";
import { SubscriptionActivatedEvent } from "../../domain/events/subscription-activated.event";
import Stripe from "stripe";

export interface SyncInvoiceFromStripeInput {
  stripeInvoice: Stripe.Invoice;
}

export interface SyncInvoiceFromStripeOutput {
  invoice: InvoiceEntity;
}

@Injectable()
export class SyncInvoiceFromStripeUseCase
  extends BaseUseCase
  implements IUseCase<SyncInvoiceFromStripeInput, SyncInvoiceFromStripeOutput>
{
  constructor(
    logger: ILoggerService,
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
    private readonly stripeSyncService: IStripeSyncService,
    private readonly eventStore: IEventStore
  ) {
    super(logger);
  }

  async execute(
    input: SyncInvoiceFromStripeInput
  ): Promise<SyncInvoiceFromStripeOutput> {
    const { stripeInvoice } = input;

    try {
      const subscriptionId =
        stripeInvoice.metadata?.subscriptionId ||
        (typeof stripeInvoice.subscription === "string"
          ? stripeInvoice.subscription
          : stripeInvoice.subscription?.id);

      if (!subscriptionId) {
        throw new DomainError(
          "SUBSCRIPTION_ID_MISSING",
          "Unable to find subscription ID in Stripe invoice",
          { stripeInvoiceId: stripeInvoice.id }
        );
      }

      const subscription =
        await this.subscriptionRepository.findByStripeSubscriptionId(
          subscriptionId
        );

      if (!subscription) {
        throw new DomainError(
          "SUBSCRIPTION_NOT_FOUND",
          "Subscription not found for this invoice",
          { subscriptionId, stripeInvoiceId: stripeInvoice.id }
        );
      }

      let invoice = await this.invoiceRepository.findByStripeInvoiceId(
        stripeInvoice.id
      );

      if (invoice) {
        invoice.updateFromStripe(stripeInvoice);
        invoice = await this.invoiceRepository.save(invoice);
      } else {
        invoice = InvoiceEntity.syncFromStripe(
          stripeInvoice,
          subscription.userId,
          subscription.organizationId,
          subscription.id
        );
        invoice = await this.invoiceRepository.save(invoice);
      }

      const previousStatus = subscription.status;
      if (
        stripeInvoice.status === "paid" &&
        subscription.status === "pending"
      ) {
        subscription.activate();
        await this.subscriptionRepository.save(subscription);

        // Émettre l'event pour l'envoi de l'email de confirmation
        const plan = await this.subscriptionPlanRepository.findById(
          subscription.planId
        );
        const planName = plan
          ? plan.name === "super-izzzi"
            ? "Super Izzzi"
            : "Izzzi"
          : "Izzzi";

        this.eventStore.publish(
          new SubscriptionActivatedEvent({
            subscriptionId: subscription.id,
            organizationId: subscription.organizationId,
            planId: subscription.planId,
            planName,
          })
        );

        this.logger.info(
          `Subscription ${subscription.id} activated and event published`
        );
      }

      this.logger.info(
        `Invoice ${invoice.id} synchronized from Stripe invoice ${stripeInvoice.id}`
      );

      return { invoice };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (error instanceof Error && error.stack) {
        this.logger.error(errorMessage, error.stack);
      } else {
        this.logger.warn(errorMessage);
      }
      throw error;
    }
  }

  async withCompensation(): Promise<void> {}
}
