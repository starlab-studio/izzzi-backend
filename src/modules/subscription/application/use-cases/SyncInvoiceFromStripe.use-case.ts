import { Injectable } from "@nestjs/common";
import { BaseUseCase, DomainError, IUseCase } from "src/core";
import type { ILoggerService } from "src/core";
import type { IInvoiceRepository } from "../../domain/repositories/invoice.repository";
import type { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import { InvoiceEntity } from "../../domain/entities/invoice.entity";
import { StripeSyncService } from "../../../payment/infrastructure/services/stripe-sync.service";
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
    private readonly stripeSyncService: StripeSyncService
  ) {
    super(logger);
  }

  async execute(
    input: SyncInvoiceFromStripeInput
  ): Promise<SyncInvoiceFromStripeOutput> {
    const { stripeInvoice } = input;

    try {
      // Récupérer la subscription depuis les metadata Stripe
      const subscriptionId =
        stripeInvoice.metadata?.subscriptionId ||
        (typeof stripeInvoice.subscription === "string"
          ? stripeInvoice.subscription
          : stripeInvoice.subscription?.id);

      if (!subscriptionId) {
        throw new DomainError(
          "SUBSCRIPTION_ID_MISSING",
          "Impossible de trouver l'ID de subscription dans l'invoice Stripe",
          { stripeInvoiceId: stripeInvoice.id }
        );
      }

      // Récupérer la subscription depuis la DB
      const subscription =
        await this.subscriptionRepository.findByStripeSubscriptionId(
          subscriptionId
        );

      if (!subscription) {
        throw new DomainError(
          "SUBSCRIPTION_NOT_FOUND",
          "Subscription non trouvée pour cet invoice",
          { subscriptionId, stripeInvoiceId: stripeInvoice.id }
        );
      }

      // Vérifier si l'invoice existe déjà
      let invoice = await this.invoiceRepository.findByStripeInvoiceId(
        stripeInvoice.id
      );

      if (invoice) {
        // Mettre à jour l'invoice existante
        invoice.updateFromStripe(stripeInvoice);
        invoice = await this.invoiceRepository.save(invoice);
      } else {
        // Créer une nouvelle invoice
        invoice = InvoiceEntity.syncFromStripe(
          stripeInvoice,
          subscription.userId,
          subscription.organizationId,
          subscription.id
        );
        invoice = await this.invoiceRepository.save(invoice);
      }

      // Si l'invoice est payée, mettre à jour le statut de la subscription
      if (
        stripeInvoice.status === "paid" &&
        subscription.status === "pending"
      ) {
        subscription.activate();
        await this.subscriptionRepository.save(subscription);
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

  async withCompensation(): Promise<void> {
    // No compensation needed for webhook sync operation
  }
}
