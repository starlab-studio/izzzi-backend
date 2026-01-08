import { IRepository } from "src/core";
import { PricingTierEntity } from "../entities/pricing-tier.entity";

export interface IPricingTierRepository extends IRepository<PricingTierEntity> {
  findByPlanId(planId: string): Promise<PricingTierEntity[]>;
  findByPlanIdAndBillingPeriod(
    planId: string,
    billingPeriod: "monthly" | "annual",
  ): Promise<PricingTierEntity[]>;
}
