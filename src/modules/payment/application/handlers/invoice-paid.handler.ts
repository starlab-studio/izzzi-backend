import { Injectable, Logger } from "@nestjs/common";
import Stripe from "stripe";
import { SyncInvoiceFromStripeUseCase } from "../../../subscription/application/use-cases/SyncInvoiceFromStripe.use-case";
import { SendSubscriptionConfirmationEmailUseCase } from "../../../subscription/application/use-cases/SendSubscriptionConfirmationEmail.use-case";
import type { ISubscriptionRepository } from "../../../subscription/domain/repositories/subscription.repository";

@Injectable()
export class InvoicePaidHandler {
  private readonly logger = new Logger(InvoicePaidHandler.name);

  constructor(
    private readonly syncInvoiceFromStripeUseCase: SyncInvoiceFromStripeUseCase,
    private readonly sendSubscriptionConfirmationEmailUseCase: SendSubscriptionConfirmationEmailUseCase,
    private readonly subscriptionRepository: ISubscriptionRepository
  ) {}

  async handle(stripeInvoice: Stripe.Invoice): Promise<void> {
    try {
      this.logger.log(
        `Processing invoice.paid event for invoice ${stripeInvoice.id}`
      );

      // Récupérer la subscription ID avant la synchronisation pour vérifier le statut
      const subscriptionId =
        stripeInvoice.metadata?.subscriptionId ||
        (typeof stripeInvoice.subscription === "string"
          ? stripeInvoice.subscription
          : stripeInvoice.subscription?.id);

      let previousStatus: string | null = null;
      if (subscriptionId) {
        const subscriptionBefore =
          await this.subscriptionRepository.findByStripeSubscriptionId(
            subscriptionId
          );
        previousStatus = subscriptionBefore?.status || null;
      }

      // Synchroniser l'invoice
      await this.syncInvoiceFromStripeUseCase.execute({
        stripeInvoice,
      });

      // Si la subscription est passée de "pending" à "active", envoyer l'email de confirmation
      if (subscriptionId && previousStatus === "pending") {
        const subscriptionAfter =
          await this.subscriptionRepository.findByStripeSubscriptionId(
            subscriptionId
          );

        if (subscriptionAfter && subscriptionAfter.status === "active") {
          try {
            await this.sendSubscriptionConfirmationEmailUseCase.execute({
              subscriptionId: subscriptionAfter.id,
              organizationId: subscriptionAfter.organizationId,
            });
            this.logger.log(
              `Confirmation email sent for subscription ${subscriptionAfter.id}`
            );
          } catch (emailError) {
            // Log l'erreur mais ne fait pas échouer le webhook
            this.logger.error(
              `Failed to send confirmation email for subscription ${subscriptionAfter.id}: ${
                emailError instanceof Error
                  ? emailError.message
                  : String(emailError)
              }`
            );
          }
        }
      }

      this.logger.log(
        `Successfully processed invoice.paid event for invoice ${stripeInvoice.id}`
      );
    } catch (error) {
      this.logger.error(
        `Error processing invoice.paid event: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}
