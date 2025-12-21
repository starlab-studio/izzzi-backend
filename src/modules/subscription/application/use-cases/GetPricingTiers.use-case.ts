import { IUseCase, ILoggerService, BaseUseCase } from "src/core";
import { IPricingTierRepository } from "../../domain/repositories/pricing-tier.repository";

export interface PricingTierResponse {
  minClasses: number;
  maxClasses: number;
  pricePerClass: number;
}

export interface GetPricingTiersInput {
  planId: string;
  billingPeriod: "monthly" | "annual";
}

export class GetPricingTiersUseCase extends BaseUseCase implements IUseCase<GetPricingTiersInput, PricingTierResponse[]> {
  constructor(
    readonly logger: ILoggerService,
    private readonly pricingTierRepository: IPricingTierRepository
  ) {
    super(logger);
  }

  async execute(input: GetPricingTiersInput): Promise<PricingTierResponse[]> {
    try {
      const tiers = await this.pricingTierRepository.findByPlanIdAndBillingPeriod(
        input.planId,
        input.billingPeriod
      );

      return tiers.map((tier) => ({
        minClasses: tier.minClasses,
        maxClasses: tier.maxClasses,
        pricePerClass: tier.pricePerClassCents / 100,
      }));
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
