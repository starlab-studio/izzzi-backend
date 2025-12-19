import { GetPricingPlansUseCase, PricingPlanResponse } from "../use-cases/GetPricingPlans.use-case";
import {
  GetPricingTiersUseCase,
  PricingTierResponse,
} from "../use-cases/GetPricingTiers.use-case";

export class SubscriptionFacade {
  constructor(
    private readonly getPricingPlansUseCase: GetPricingPlansUseCase,
    private readonly getPricingTiersUseCase: GetPricingTiersUseCase
  ) {}

  async getPricingPlans(): Promise<PricingPlanResponse[]> {
    try {
      return await this.getPricingPlansUseCase.execute();
    } catch (error) {
      throw error;
    }
  }

  async getPricingTiers(
    planId: string,
    billingPeriod: "monthly" | "annual"
  ): Promise<PricingTierResponse[]> {
    try {
      return await this.getPricingTiersUseCase.execute({ planId, billingPeriod });
    } catch (error) {
      throw error;
    }
  }
}
