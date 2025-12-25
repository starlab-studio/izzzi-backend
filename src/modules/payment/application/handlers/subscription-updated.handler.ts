import { Injectable, Logger } from "@nestjs/common";
import Stripe from "stripe";
import { SyncSubscriptionFromStripeUseCase } from "../../../subscription/application/use-cases/SyncSubscriptionFromStripe.use-case";

@Injectable()
export class SubscriptionUpdatedHandler {
  private readonly logger = new Logger(SubscriptionUpdatedHandler.name);

  constructor(
    private readonly syncSubscriptionFromStripeUseCase: SyncSubscriptionFromStripeUseCase
  ) {}

  async handle(stripeSubscription: Stripe.Subscription): Promise<void> {
    try {
      this.logger.log(
        `Processing customer.subscription.updated event for subscription ${stripeSubscription.id}`
      );

      await this.syncSubscriptionFromStripeUseCase.execute({
        stripeSubscription,
      });

      this.logger.log(
        `Successfully processed customer.subscription.updated event for subscription ${stripeSubscription.id}`
      );
    } catch (error) {
      this.logger.error(
        `Error processing customer.subscription.updated event: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}
