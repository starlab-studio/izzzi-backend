import { Injectable, Logger } from "@nestjs/common";
import Stripe from "stripe";
import { SyncSubscriptionFromStripeUseCase } from "../../../subscription/application/use-cases/SyncSubscriptionFromStripe.use-case";

@Injectable()
export class PaymentIntentSucceededHandler {
  private readonly logger = new Logger(PaymentIntentSucceededHandler.name);

  constructor(
    private readonly syncSubscriptionFromStripeUseCase: SyncSubscriptionFromStripeUseCase
  ) {}

  async handle(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      this.logger.log(
        `Processing payment_intent.succeeded event for payment intent ${paymentIntent.id}`
      );

      // Si le payment intent est lié à une subscription, on synchronise la subscription
      if (paymentIntent.metadata?.subscriptionId) {
        const subscriptionId = paymentIntent.metadata.subscriptionId;
        const stripeSubscription =
          await this.getStripeSubscription(subscriptionId);

        if (stripeSubscription) {
          await this.syncSubscriptionFromStripeUseCase.execute({
            stripeSubscription,
          });
        }
      }

      this.logger.log(
        `Successfully processed payment_intent.succeeded event for payment intent ${paymentIntent.id}`
      );
    } catch (error) {
      this.logger.error(
        `Error processing payment_intent.succeeded event: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined
      );
      // Ne pas throw pour éviter les retries Stripe
    }
  }

  private async getStripeSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription | null> {
    // Cette méthode devrait utiliser StripeSyncService pour récupérer la subscription
    // Pour l'instant, on retourne null et on laisse le handler subscription.updated gérer
    return null;
  }
}
