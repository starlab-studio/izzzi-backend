import { BaseUseCase, DomainError, IUseCase } from "src/core";
import type { ILoggerService, IEventStore } from "src/core";
import type { IInvoiceRepository } from "../../domain/repositories/invoice.repository";
import type { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import type { ISubscriptionPlanRepository } from "../../domain/repositories/subscription-plan.repository";
import { InvoiceEntity } from "../../domain/entities/invoice.entity";
import type { IStripeSyncService } from "../../../payment/domain/services/stripe-sync.service";
import type { StripeInvoice } from "../../../payment/domain/types/stripe.types";
import { SubscriptionActivatedEvent } from "../../domain/events/subscription-activated.event";

export interface SyncInvoiceFromStripeInput {
  stripeInvoice: StripeInvoice;
}

export interface SyncInvoiceFromStripeOutput {
  invoice: InvoiceEntity;
}

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
    private readonly eventStore: IEventStore,
  ) {
    super(logger);
  }

  async execute(
    input: SyncInvoiceFromStripeInput,
  ): Promise<SyncInvoiceFromStripeOutput> {
    const { stripeInvoice } = input;

    try {
      const subscriptionId =
        stripeInvoice.metadata?.subscriptionId ||
        (typeof stripeInvoice.subscription === "string"
          ? stripeInvoice.subscription
          : stripeInvoice.subscription?.id || null);

      if (!subscriptionId) {
        throw new DomainError(
          "SUBSCRIPTION_ID_MISSING",
          "Unable to find subscription ID in Stripe invoice",
          { stripeInvoiceId: stripeInvoice.id },
        );
      }

      const subscription =
        await this.subscriptionRepository.findByStripeSubscriptionId(
          subscriptionId,
        );

      if (!subscription) {
        throw new DomainError(
          "SUBSCRIPTION_NOT_FOUND",
          "Subscription not found for this invoice",
          { subscriptionId, stripeInvoiceId: stripeInvoice.id },
        );
      }

      let invoice = await this.invoiceRepository.findByStripeInvoiceId(
        stripeInvoice.id,
      );

      if (invoice) {
        invoice.updateFromDomainInvoice(stripeInvoice);
        invoice = await this.invoiceRepository.save(invoice);
      } else {
        invoice = InvoiceEntity.syncFromDomainInvoice(
          stripeInvoice,
          subscription.userId,
          subscription.organizationId,
          subscription.id,
        );
        invoice = await this.invoiceRepository.save(invoice);
      }

      const previousStatus = subscription.status;
      if (
        stripeInvoice.status === "paid" &&
        (subscription.status === "pending" || subscription.status === "trial")
      ) {
        const plan = await this.subscriptionPlanRepository.findById(
          subscription.planId,
        );

        if (subscription.status === "pending") {
          subscription.activate();

          if (
            !subscription.currentPeriodStart ||
            !subscription.currentPeriodEnd
          ) {
            this.logger.warn(
              `Subscription ${subscription.id} missing period dates at activation time; attempting to sync from Stripe`,
            );

            if (subscription.stripeSubscriptionId) {
              try {
                const stripeSubscription =
                  await this.stripeSyncService.getSubscription(
                    subscription.stripeSubscriptionId,
                  );

                if (
                  stripeSubscription &&
                  stripeSubscription.current_period_start &&
                  stripeSubscription.current_period_end
                ) {
                  (subscription as any).props.currentPeriodStart = new Date(
                    stripeSubscription.current_period_start * 1000,
                  );
                  (subscription as any).props.currentPeriodEnd = new Date(
                    stripeSubscription.current_period_end * 1000,
                  );
                  (subscription as any).props.updatedAt = new Date();
                  this.logger.info(
                    `Extracted period dates from Stripe subscription for ${subscription.id}`,
                  );
                }
              } catch (stripeError) {
                this.logger.error(
                  `Failed to sync period dates from Stripe for subscription ${subscription.id}: ${
                    stripeError instanceof Error
                      ? stripeError.message
                      : String(stripeError)
                  }`,
                  stripeError instanceof Error ? stripeError.stack || "" : "",
                );
              }
            }
          }

          await this.subscriptionRepository.save(subscription);
        }

        if (!plan || !plan.isFree) {
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
            }),
          );

          this.logger.info(
            `Subscription ${subscription.id} activated and event published`,
          );
        } else {
          this.logger.info(
            `Free plan subscription ${subscription.id} - keeping trial status after invoice payment`,
          );
        }
      }

      this.logger.info(
        `Invoice ${invoice.id} synchronized from Stripe invoice ${stripeInvoice.id}`,
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
