import { Injectable, Inject } from "@nestjs/common";
import { SubscriptionPlanEntity } from "src/modules/subscription/domain/entities/subscription-plan.entity";
import { PricingTierEntity } from "src/modules/subscription/domain/entities/pricing-tier.entity";
import type { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { SUBSCRIPTION_PLAN_REPOSITORY } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import type { IPricingTierRepository } from "src/modules/subscription/domain/repositories/pricing-tier.repository";
import type { IStripeSyncService } from "src/modules/payment/domain/services/stripe-sync.service";
import { STRIPE_SYNC_SERVICE } from "src/modules/payment/domain/services/stripe-sync.service";
import type { ILoggerService } from "src/core";

export interface UpdatePlanInput {
  planId: string;
  displayPrice?: string;
  priceSubtext?: string | null;
  basePriceCents?: number;
  trialPeriodDays?: number;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdatePlanOutput {
  plan: {
    id: string;
    name: string;
    displayPrice: string;
    priceSubtext: string | null;
    basePriceCents: number;
    trialPeriodDays: number;
    isFree: boolean;
    variant: "default" | "premium";
    isActive: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

@Injectable()
export class UpdatePlanUseCase {
  constructor(
    @Inject(SUBSCRIPTION_PLAN_REPOSITORY)
    private readonly planRepository: ISubscriptionPlanRepository,
    @Inject("IPricingTierRepository")
    private readonly pricingTierRepository: IPricingTierRepository,
    @Inject(STRIPE_SYNC_SERVICE)
    private readonly stripeSyncService: IStripeSyncService,
    @Inject("ILoggerService")
    private readonly logger: ILoggerService
  ) {}

  async execute(input: UpdatePlanInput): Promise<UpdatePlanOutput> {
    const existingPlan = await this.planRepository.findById(input.planId);

    if (!existingPlan) {
      throw new Error("Plan not found");
    }

    const persistence = existingPlan.toPersistence();
    const updatedPersistence = {
      ...persistence,
      displayPrice: input.displayPrice !== undefined ? input.displayPrice : persistence.displayPrice,
      priceSubtext: input.priceSubtext !== undefined ? input.priceSubtext : persistence.priceSubtext,
      basePriceCents: input.basePriceCents !== undefined ? input.basePriceCents : persistence.basePriceCents,
      trialPeriodDays: input.trialPeriodDays !== undefined ? input.trialPeriodDays : persistence.trialPeriodDays,
      isActive: input.isActive !== undefined ? input.isActive : persistence.isActive,
      displayOrder: input.displayOrder !== undefined ? input.displayOrder : persistence.displayOrder,
      updatedAt: new Date(),
    };

    const updatedPlanEntity = SubscriptionPlanEntity.reconstitute(updatedPersistence);
    const savedPlan = await this.planRepository.save(updatedPlanEntity);

    if (savedPlan.isActive && !savedPlan.isFree) {
      try {
        this.logger.info(`Syncing plan ${savedPlan.name} (${savedPlan.id}) with Stripe after update`);
        
        const productId = await this.stripeSyncService.syncPlanToStripe(savedPlan);
        
        if (!productId) {
          this.logger.warn(
            `No product ID returned from Stripe sync for plan ${savedPlan.name} (${savedPlan.id})`
          );
        } else {
          const currentProductId = savedPlan.stripeProductId || null;
          if (currentProductId !== productId) {
            const planWithProductId = SubscriptionPlanEntity.reconstitute({
              ...savedPlan.toPersistence(),
              stripeProductId: productId,
              updatedAt: new Date(),
            });
            await this.planRepository.save(planWithProductId);
          }

          const tiers = await this.pricingTierRepository.findByPlanId(savedPlan.id);
          
          if (tiers.length > 0) {
            const tierToPriceIdMap = await this.stripeSyncService.syncPricingTiersToStripe(
              productId,
              tiers
            );

            for (const tier of tiers) {
              const priceId = tierToPriceIdMap.get(tier.id);
              if (priceId && tier.stripePriceId !== priceId) {
                const updatedTier = PricingTierEntity.reconstitute({
                  ...tier.toPersistence(),
                  stripePriceId: priceId,
                });
                await this.pricingTierRepository.save(updatedTier);
              }
            }

            this.logger.info(
              `Synced ${tiers.length} pricing tiers for plan ${savedPlan.name} with Stripe`
            );
          } else {
            this.logger.warn(
              `No pricing tiers found for plan ${savedPlan.name} (${savedPlan.id})`
            );
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error && error.stack ? error.stack : "";
        this.logger.error(
          `Failed to sync plan ${savedPlan.name} (${savedPlan.id}) with Stripe: ${errorMessage}`,
          errorStack
        );
      }
    }

    return {
      plan: {
        id: savedPlan.id,
        name: savedPlan.name,
        displayPrice: savedPlan.displayPrice,
        priceSubtext: savedPlan.priceSubtext,
        basePriceCents: savedPlan.basePriceCents,
        trialPeriodDays: savedPlan.trialPeriodDays,
        isFree: savedPlan.isFree,
        variant: savedPlan.variant,
        isActive: savedPlan.isActive,
        displayOrder: savedPlan.displayOrder,
        createdAt: savedPlan.createdAt,
        updatedAt: savedPlan.updatedAt,
      },
    };
  }
}

