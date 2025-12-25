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

    const currentClassCount =
      await this.classRepository.countByOrganization(organizationId);

    if (currentClassCount >= subscription.quantity) {
      return {
        canCreate: false,
        reason: "You have reached the class limit allowed by your subscription",
      };
    }

    return { canCreate: true };
  }
}
