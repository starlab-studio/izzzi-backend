import { IUseCase, ILoggerService, BaseUseCase, ErrorCode } from "src/core";
import { DomainError } from "src/core/domain/errors/domain.error";
import { ISubscriptionPlanRepository } from "../../domain/repositories/subscription-plan.repository";
import { IPricingTierRepository } from "../../domain/repositories/pricing-tier.repository";

export interface CalculatePriceInput {
  planId: string;
  classCount: number;
  billingPeriod?: "monthly" | "annual";
}

export interface CalculatePriceOutput {
  planId: string;
  planName: string;
  classCount: number;
  pricePerClassCents: number;
  totalPriceCents: number;
  totalPriceFormatted: string;
  pricePerClassFormatted: string;
  billingPeriod: "monthly" | "annual";
  tier: {
    minClasses: number;
    maxClasses: number;
  };
}

export class CalculateSubscriptionPriceUseCase
  extends BaseUseCase
  implements IUseCase<CalculatePriceInput, CalculatePriceOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
    private readonly pricingTierRepository: IPricingTierRepository,
  ) {
    super(logger);
  }

  async execute(input: CalculatePriceInput): Promise<CalculatePriceOutput> {
    try {
      const { planId, classCount, billingPeriod = "monthly" } = input;

      if (
        typeof classCount !== "number" ||
        !Number.isInteger(classCount) ||
        classCount < 1 ||
        classCount > 20
      ) {
        throw new DomainError(
          ErrorCode.INVALID_CLASS_COUNT,
          "classCount must be an integer between 1 and 20",
          { classCount },
        );
      }

      if (billingPeriod && !["monthly", "annual"].includes(billingPeriod)) {
        throw new DomainError(
          ErrorCode.INVALID_BILLING_PERIOD,
          "billingPeriod must be 'monthly' or 'annual'",
          { billingPeriod },
        );
      }

      const plan = await this.subscriptionPlanRepository.findById(planId);
      if (!plan) {
        throw new DomainError(
          ErrorCode.PLAN_NOT_FOUND,
          "Le plan de subscription n'existe pas",
          { planId },
        );
      }

      if (!plan.isActive) {
        throw new DomainError(
          ErrorCode.PLAN_NOT_ACTIVE,
          "Le plan de subscription n'est pas actif",
          { planId },
        );
      }

      const tiers =
        await this.pricingTierRepository.findByPlanIdAndBillingPeriod(
          plan.id,
          billingPeriod,
        );

      if (tiers.length === 0) {
        throw new DomainError(
          ErrorCode.NO_PRICING_TIERS,
          "Aucun palier de tarification trouvé pour ce plan et cette période",
          { planId, billingPeriod },
        );
      }

      const tier = tiers.find(
        (t) => classCount >= t.minClasses && classCount <= t.maxClasses,
      );

      if (!tier) {
        throw new DomainError(
          ErrorCode.TIER_NOT_FOUND,
          `Aucun palier de tarification trouvé pour ${classCount} classe(s)`,
          {
            planId,
            billingPeriod,
            classCount,
            availableTiers: tiers.map((t) => ({
              min: t.minClasses,
              max: t.maxClasses,
            })),
          },
        );
      }

      const pricePerClassCents = tier.pricePerClassCents;
      let totalPriceCents = pricePerClassCents * classCount;

      if (billingPeriod === "annual") {
        totalPriceCents = totalPriceCents * 12;
      }

      const totalPriceFormatted = this.formatPrice(totalPriceCents);
      const pricePerClassFormatted = this.formatPrice(pricePerClassCents);

      return {
        planId: plan.id,
        planName: plan.name,
        classCount,
        pricePerClassCents,
        totalPriceCents,
        totalPriceFormatted,
        pricePerClassFormatted,
        billingPeriod,
        tier: {
          minClasses: tier.minClasses,
          maxClasses: tier.maxClasses,
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}

  private formatPrice(cents: number): string {
    const euros = cents / 100;
    const rounded = Math.round(euros * 100) / 100;
    if (rounded % 1 === 0) {
      return `${rounded}€`;
    }
    return `${rounded.toFixed(2)}€`;
  }
}
