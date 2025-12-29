import { DomainError, ErrorCode } from "src/core";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { IClassRepository } from "../repositories/class.repository";

export interface ClassLimitCheckResult {
  canCreate: boolean;
  reason?: string;
}

export class ClassLimitService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
    private readonly classRepository: IClassRepository
  ) {}

  async canCreateClass(organizationId: string): Promise<ClassLimitCheckResult> {
    const subscription =
      await this.subscriptionRepository.findActiveByOrganizationId(
        organizationId
      );

    if (!subscription) {
      return { canCreate: true };
    }

    if (subscription.status === "pending") {
      return {
        canCreate: false,
        reason:
          "Your subscription is pending payment confirmation. Please complete your payment to create classes.",
      };
    }

    const plan = await this.subscriptionPlanRepository.findById(
      subscription.planId
    );

    if (!plan) {
      throw new DomainError(
        ErrorCode.PLAN_NOT_FOUND,
        "Subscription plan associated with this organization does not exist",
        { planId: subscription.planId, organizationId }
      );
    }

    if (plan.isFree) {
      return { canCreate: true };
    }

    // ✅ Utiliser la quantité actuelle (pas pendingQuantity) car les downgrades prennent effet à la fin de période
    const currentQuantity = subscription.quantity;

    if (currentQuantity <= 0) {
      return {
        canCreate: false,
        reason:
          "Your subscription does not allow creating classes. Please contact support or upgrade your plan.",
      };
    }

    const currentClassCount =
      await this.classRepository.countByOrganization(organizationId);

    if (currentClassCount >= currentQuantity) {
      const pendingInfo =
        subscription.pendingQuantity !== null
          ? ` (Note: Your subscription will be reduced to ${subscription.pendingQuantity} class${subscription.pendingQuantity > 1 ? "es" : ""} at the end of your current billing period)`
          : "";

      return {
        canCreate: false,
        reason: `You have reached your class limit. You currently have ${currentClassCount} active class${currentClassCount > 1 ? "es" : ""} out of ${currentQuantity} allowed by your subscription.${pendingInfo} Please upgrade your plan to create more classes.`,
      };
    }

    return { canCreate: true };
  }
}
