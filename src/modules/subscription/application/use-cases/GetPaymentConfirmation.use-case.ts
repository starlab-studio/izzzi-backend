import { Injectable } from "@nestjs/common";
import { BaseUseCase, DomainError, IUseCase } from "src/core";
import type { ILoggerService } from "src/core";
import type { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import type { IInvoiceRepository } from "../../domain/repositories/invoice.repository";
import { InvoiceEntity } from "../../domain/entities/invoice.entity";
import { StripeSyncService } from "../../../payment/infrastructure/services/stripe-sync.service";

export interface GetPaymentConfirmationInput {
  organizationId: string;
  userId: string;
}

export interface GetPaymentConfirmationOutput {
  planName: string;
  billingPeriod: "monthly" | "annual";
  amountPaid: number;
  amountFormatted: string;
  paymentMethod: {
    last4: string;
    brand: string;
  };
  nextPaymentDate: Date;
  invoicePdfUrl: string | null;
  hostedInvoiceUrl: string | null;
}

@Injectable()
export class GetPaymentConfirmationUseCase
  extends BaseUseCase
  implements IUseCase<GetPaymentConfirmationInput, GetPaymentConfirmationOutput>
{
  constructor(
    logger: ILoggerService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly stripeSyncService: StripeSyncService
  ) {
    super(logger);
  }

  async execute(
    input: GetPaymentConfirmationInput
  ): Promise<GetPaymentConfirmationOutput> {
    const { organizationId, userId } = input;

    try {
      let subscription =
        await this.subscriptionRepository.findActiveByOrganizationId(
          organizationId
        );

      if (!subscription) {
        subscription =
          await this.subscriptionRepository.findByOrganizationId(
            organizationId
          );
      }

      if (!subscription) {
        throw new DomainError(
          "SUBSCRIPTION_NOT_FOUND",
          "Aucune subscription trouvée pour cette organisation",
          { organizationId }
        );
      }

      if (subscription.userId !== userId) {
        throw new DomainError(
          "UNAUTHORIZED",
          "Vous n'avez pas accès à cette subscription",
          { userId, subscriptionUserId: subscription.userId }
        );
      }

      if (
        subscription.status !== "active" &&
        subscription.status !== "trial" &&
        subscription.status !== "pending"
      ) {
        throw new DomainError(
          "SUBSCRIPTION_NOT_ACTIVE",
          "La subscription n'est pas active ou en attente de confirmation",
          { organizationId, status: subscription.status }
        );
      }

      let invoice =
        await this.invoiceRepository.findLatestByOrganizationId(organizationId);

      if (!invoice && subscription.stripeSubscriptionId) {
        const stripeSubscription = await this.stripeSyncService.getSubscription(
          subscription.stripeSubscriptionId
        );

        if (stripeSubscription?.latest_invoice) {
          const invoiceId =
            typeof stripeSubscription.latest_invoice === "string"
              ? stripeSubscription.latest_invoice
              : stripeSubscription.latest_invoice.id;

          const stripeInvoice =
            await this.stripeSyncService.getInvoice(invoiceId);

          if (stripeInvoice) {
            invoice = InvoiceEntity.syncFromStripe(
              stripeInvoice,
              subscription.userId,
              subscription.organizationId,
              subscription.id
            );
            invoice = await this.invoiceRepository.save(invoice);
          }
        }
      }

      if (!invoice) {
        throw new DomainError(
          "INVOICE_NOT_FOUND",
          "Aucune facture trouvée pour cette subscription",
          { subscriptionId: subscription.id }
        );
      }

      let paymentMethod: { last4: string; brand: string } | null = null;

      if (subscription.stripeSubscriptionId) {
        const stripeSubscription = await this.stripeSyncService.getSubscription(
          subscription.stripeSubscriptionId
        );

        if (stripeSubscription?.default_payment_method) {
          const pmId =
            typeof stripeSubscription.default_payment_method === "string"
              ? stripeSubscription.default_payment_method
              : stripeSubscription.default_payment_method.id;

          const pm = await this.stripeSyncService.getPaymentMethod(pmId);
          if (pm && pm.card) {
            paymentMethod = {
              last4: pm.card.last4,
              brand: pm.card.brand,
            };
          }
        } else if (invoice.stripeInvoiceId) {
          const stripeInvoice = await this.stripeSyncService.getInvoice(
            invoice.stripeInvoiceId
          );

          if (
            stripeInvoice?.payment_intent &&
            typeof stripeInvoice.payment_intent !== "string"
          ) {
            const paymentIntent = stripeInvoice.payment_intent;
            if (
              paymentIntent.payment_method &&
              typeof paymentIntent.payment_method !== "string"
            ) {
              const pm = paymentIntent.payment_method;
              if (pm.card) {
                paymentMethod = {
                  last4: pm.card.last4,
                  brand: pm.card.brand,
                };
              }
            }
          }
        }
      }

      if (!paymentMethod) {
        paymentMethod = {
          last4: "****",
          brand: "card",
        };
      }

      const amountInEuros = invoice.amountCents / 100;
      const amountFormatted = `${amountInEuros.toFixed(2)}€ TTC`;

      const nextPaymentDate = subscription.currentPeriodEnd || new Date();

      const planName =
        subscription.planId === "super-izzzi" ? "Super Izzzi" : "Izzzi";

      return {
        planName,
        billingPeriod: subscription.billingPeriod,
        amountPaid: invoice.amountCents,
        amountFormatted,
        paymentMethod,
        nextPaymentDate,
        invoicePdfUrl: invoice.pdfUrl,
        hostedInvoiceUrl: invoice.hostedInvoiceUrl,
      };
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
    // No compensation needed for read-only operation
  }
}
