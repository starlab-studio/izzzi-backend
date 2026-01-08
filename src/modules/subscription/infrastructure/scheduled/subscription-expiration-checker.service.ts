import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import type { ILoggerService } from "src/core";
import type { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import type { IStripeSyncService } from "src/modules/payment/domain/services/stripe-sync.service";
import { SyncSubscriptionFromStripeUseCase } from "../../application/use-cases/SyncSubscriptionFromStripe.use-case";

@Injectable()
export class SubscriptionExpirationCheckerService {
  constructor(
    private readonly logger: ILoggerService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly stripeSyncService: IStripeSyncService,
    private readonly syncSubscriptionFromStripeUseCase: SyncSubscriptionFromStripeUseCase,
  ) {}

  @Cron("0 * * * *")
  async checkExpiredSubscriptions(): Promise<void> {
    this.logger.info("Checking for subscriptions with expired periods...");

    try {
      const now = new Date();

      const subscriptionsToCheck =
        await this.subscriptionRepository.findExpiredWithStripeId(now);

      this.logger.info(
        `Found ${subscriptionsToCheck.length} subscription(s) with expired periods to check`,
      );

      let checkedCount = 0;
      let syncedCount = 0;
      let errorCount = 0;

      for (const subscription of subscriptionsToCheck) {
        try {
          checkedCount++;

          const stripeSubscription =
            await this.stripeSyncService.getSubscription(
              subscription.stripeSubscriptionId!,
            );

          if (!stripeSubscription) {
            this.logger.warn(
              `Subscription ${subscription.id} (Stripe ID: ${subscription.stripeSubscriptionId}) not found in Stripe, skipping`,
            );
            continue;
          }

          await this.syncSubscriptionFromStripeUseCase.execute({
            stripeSubscription,
          });

          syncedCount++;

          this.logger.info(
            `Synchronized subscription ${subscription.id} from Stripe (status: ${stripeSubscription.status})`,
          );
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Error processing subscription ${subscription.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
            error instanceof Error ? error.stack || "" : "",
          );
        }
      }

      this.logger.info(
        `Finished checking expired subscriptions. Checked: ${checkedCount}, Synced: ${syncedCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Error in checkExpiredSubscriptions: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack || "" : "",
      );
    }
  }
}
