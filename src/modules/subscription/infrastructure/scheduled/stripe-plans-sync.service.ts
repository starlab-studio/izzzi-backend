import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import type { ILoggerService } from "src/core";
import { SyncPlansWithStripeUseCase } from "../../application/use-cases/SyncPlansWithStripe.use-case";

@Injectable()
export class StripePlansSyncService {
  constructor(
    private readonly logger: ILoggerService,
    private readonly syncPlansWithStripeUseCase: SyncPlansWithStripeUseCase
  ) {}

  @Cron("0 2 * * *")
  async syncPlansWithStripe(): Promise<void> {
    this.logger.info("Starting scheduled sync of plans with Stripe...");

    try {
      const result = await this.syncPlansWithStripeUseCase.execute();

      this.logger.info(
        `Scheduled sync completed. Synced ${result.syncedPlans} plan(s) and ${result.syncedTiers} tier(s)`
      );

      if (result.details.length > 0) {
        result.details.forEach((detail) => {
          this.logger.info(
            `Plan ${detail.planName} (${detail.planId}): ${detail.tiersSynced} tier(s) synced, Stripe Product ID: ${detail.productId}`
          );
        });
      }
    } catch (error) {
      this.logger.error(
        `Error during scheduled sync of plans with Stripe: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack || "" : ""
      );
    }
  }
}
