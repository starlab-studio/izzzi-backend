import { IUseCase, BaseUseCase, type ILoggerService } from "src/core";
import type { ISubscriptionPlanRepository } from "../../domain/repositories/subscription-plan.repository";
import type { IPricingTierRepository } from "../../domain/repositories/pricing-tier.repository";
import { StripeSyncService } from "src/modules/payment/infrastructure/services/stripe-sync.service";
import { SubscriptionPlanEntity } from "../../domain/entities/subscription-plan.entity";
import { PricingTierEntity } from "../../domain/entities/pricing-tier.entity";

export interface SyncPlansWithStripeOutput {
  syncedPlans: number;
  syncedTiers: number;
  details: Array<{
    planId: string;
    planName: string;
    productId: string;
    tiersSynced: number;
  }>;
}

export class SyncPlansWithStripeUseCase
  extends BaseUseCase
  implements IUseCase<void, SyncPlansWithStripeOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
    private readonly pricingTierRepository: IPricingTierRepository,
    private readonly stripeSyncService: StripeSyncService
  ) {
    super(logger);
  }

  async execute(): Promise<SyncPlansWithStripeOutput> {
    try {
      const plans = await this.subscriptionPlanRepository.findAllActive();
      let syncedPlans = 0;
      let syncedTiers = 0;
      const details: Array<{
        planId: string;
        planName: string;
        productId: string;
        tiersSynced: number;
      }> = [];

      for (const plan of plans) {
        if (plan.isFree) {
          continue;
        }

        try {
          const productId = await this.stripeSyncService.syncPlanToStripe(plan);

          if (plan.stripeProductId !== productId) {
            const updatedPlan = SubscriptionPlanEntity.reconstitute({
              ...plan.toPersistence(),
              stripeProductId: productId,
              updatedAt: new Date(),
            });
            await this.subscriptionPlanRepository.save(updatedPlan);
          }

          syncedPlans++;

          const tiers = await this.pricingTierRepository.findByPlanId(plan.id);

          if (tiers.length === 0) {
            this.logger.warn(
              `No pricing tiers found for plan ${plan.name} (${plan.id})`
            );
            details.push({
              planId: plan.id,
              planName: plan.name,
              productId,
              tiersSynced: 0,
            });
            continue;
          }

          const tierToPriceIdMap =
            await this.stripeSyncService.syncPricingTiersToStripe(
              productId,
              tiers
            );

          let planTiersSynced = 0;
          for (const tier of tiers) {
            const priceId = tierToPriceIdMap.get(tier.id);
            if (priceId && tier.stripePriceId !== priceId) {
              const updatedTier = PricingTierEntity.reconstitute({
                ...tier.toPersistence(),
                stripePriceId: priceId,
              });
              await this.pricingTierRepository.save(updatedTier);
              planTiersSynced++;
              syncedTiers++;
            }
          }

          details.push({
            planId: plan.id,
            planName: plan.name,
            productId,
            tiersSynced: planTiersSynced,
          });

          this.logger.info(
            `Synced plan ${plan.name}: ${planTiersSynced} tiers synchronized`
          );
        } catch (error) {
          this.logger.error(
            `Failed to sync plan ${plan.name} (${plan.id}): ${error}`,
            error instanceof Error ? error.stack || "" : ""
          );
          throw error;
        }
      }

      return {
        syncedPlans,
        syncedTiers,
        details,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
