import { IUseCase, ILoggerService, BaseUseCase, DomainError } from "src/core";
import { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "../../domain/repositories/subscription-plan.repository";
import { IPricingTierRepository } from "../../domain/repositories/pricing-tier.repository";
import { IPlanFeatureRepository } from "../../domain/repositories/plan-feature.repository";
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { SubscriptionEntity } from "../../domain/entities/subscription.entity";

export interface GetSubscriptionInput {
  userId?: string;
  organizationId?: string;
  subscriptionId?: string;
}

export interface SubscriptionDetailOutput {
  subscription: {
    id: string;
    userId: string;
    organizationId: string;
    status: string;
    quantity: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    trialEnd: Date | null;
    createdAt: Date;
  };
  plan: {
    id: string;
    name: string;
    variant: "default" | "premium";
    displayPrice: string;
  };
  pricing: {
    pricePerClassCents: number;
    totalPriceCents: number;
    pricePerClassFormatted: string;
    totalPriceFormatted: string;
  };
  features: {
    featureKey: string;
    featureText: string;
    featureSubtext: string | null;
    isComingSoon: boolean;
  }[];
  usage?: {
    classesUsed: number;
    classesRemaining: number;
  };
}

export class GetSubscriptionUseCase
  extends BaseUseCase
  implements IUseCase<GetSubscriptionInput, SubscriptionDetailOutput | null>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
    private readonly pricingTierRepository: IPricingTierRepository,
    private readonly planFeatureRepository: IPlanFeatureRepository,
    private readonly userRepository: IUserRepository
  ) {
    super(logger);
  }

  async execute(
    input: GetSubscriptionInput
  ): Promise<SubscriptionDetailOutput | null> {
    try {
      const { userId, organizationId, subscriptionId } = input;

      if (!userId && !organizationId && !subscriptionId) {
        throw new DomainError(
          "INVALID_INPUT",
          "At least one identifier (userId, organizationId, or subscriptionId) must be provided"
        );
      }

      if (userId && !organizationId) {
        const user =
          await this.userRepository.findByIdWithActiveMemberships(userId);
        if (!user) {
          throw new DomainError("USER_NOT_FOUND", "User not found");
        }

        const userOrganizations = user.getOrganizationIds();
        if (userOrganizations.length === 1) {
          input.organizationId = userOrganizations[0];
        } else if (userOrganizations.length > 1 && !organizationId) {
          throw new DomainError(
            "MULTIPLE_ORGANIZATIONS",
            "User belongs to multiple organizations. Please specify organizationId"
          );
        }
      }

      let subscription: SubscriptionEntity | null = null;

      if (subscriptionId) {
        subscription =
          await this.subscriptionRepository.findById(subscriptionId);
      } else if (organizationId) {
        subscription =
          await this.subscriptionRepository.findActiveByOrganizationId(
            organizationId
          );
      } else if (userId) {
        subscription = await this.subscriptionRepository.findByUserId(userId);
        if (subscription && !subscription.isActive) {
          subscription = null;
        }
      }

      if (!subscription) {
        return null;
      }

      const plan = await this.subscriptionPlanRepository.findById(
        subscription.planId
      );
      if (!plan) {
        throw new DomainError(
          "PLAN_NOT_FOUND",
          "Plan not found for this subscription",
          { planId: subscription.planId }
        );
      }

      const features = await this.planFeatureRepository.findByPlanId(plan.id);

      const effectiveQuantity =
        subscription.pendingQuantity !== null
          ? subscription.pendingQuantity
          : subscription.quantity;

      let pricePerClassCents = 0;
      let totalPriceCents = 0;

      if (!plan.isFree) {
        const tiers =
          await this.pricingTierRepository.findByPlanIdAndBillingPeriod(
            plan.id,
            subscription.billingPeriod
          );

        if (tiers.length > 0) {
          const tier = tiers.find(
            (t) =>
              effectiveQuantity >= t.minClasses &&
              effectiveQuantity <= t.maxClasses
          );

          if (tier) {
            pricePerClassCents = tier.pricePerClassCents;
            totalPriceCents = pricePerClassCents * effectiveQuantity;
          }
        }
      }

      const pricePerClassFormatted = this.formatPrice(pricePerClassCents);
      const totalPriceFormatted = this.formatPrice(totalPriceCents);

      const cancelAtPeriodEnd =
        subscription.cancelledAt !== null &&
        subscription.cancelledAt.getTime() ===
          subscription.currentPeriodEnd?.getTime();

      const displayQuantity =
        subscription.pendingQuantity !== null
          ? subscription.pendingQuantity
          : subscription.quantity;

      return {
        subscription: {
          id: subscription.id,
          userId: subscription.userId,
          organizationId: subscription.organizationId,
          status: subscription.status,
          quantity: displayQuantity,
          currentPeriodStart: subscription.currentPeriodStart!,
          currentPeriodEnd: subscription.currentPeriodEnd!,
          cancelAtPeriodEnd,
          trialEnd: subscription.trialEndDate,
          createdAt: subscription.createdAt,
        },
        plan: {
          id: plan.id,
          name: plan.name,
          variant: plan.variant,
          displayPrice: plan.displayPrice,
        },
        pricing: {
          pricePerClassCents,
          totalPriceCents,
          pricePerClassFormatted,
          totalPriceFormatted,
        },
        features: features.map((f) => ({
          featureKey: f.id,
          featureText: f.featureText,
          featureSubtext: f.featureSubtext,
          isComingSoon: f.isComingSoon,
        })),
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
