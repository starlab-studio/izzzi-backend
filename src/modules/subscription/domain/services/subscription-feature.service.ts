import type { ISubscriptionRepository } from "../repositories/subscription.repository";
import type { ISubscriptionPlanRepository } from "../repositories/subscription-plan.repository";

export class SubscriptionFeatureService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
  ) {}

  async canShareQuizzes(organizationId: string): Promise<boolean> {
    const subscription =
      await this.subscriptionRepository.findActiveByOrganizationId(
        organizationId,
      );

    if (!subscription) {
      return false;
    }

    if (subscription.status === "pending") {
      return false;
    }

    const plan = await this.subscriptionPlanRepository.findById(
      subscription.planId,
    );

    if (!plan) {
      return false;
    }

    if (plan.isFree) {
      return subscription.isTrialActive;
    }

    return true;
  }

  async canSeeAllResponses(organizationId: string): Promise<boolean> {
    const subscription =
      await this.subscriptionRepository.findActiveByOrganizationId(
        organizationId,
      );

    if (!subscription) {
      return false;
    }

    if (subscription.status === "pending") {
      return false;
    }

    const plan = await this.subscriptionPlanRepository.findById(
      subscription.planId,
    );

    if (!plan) {
      return false;
    }

    if (plan.isFree) {
      return subscription.isTrialActive;
    }

    return true;
  }

  async getMaxVisibleResponses(organizationId: string): Promise<number | null> {
    const subscription =
      await this.subscriptionRepository.findActiveByOrganizationId(
        organizationId,
      );

    if (!subscription) {
      return 0;
    }

    if (subscription.status === "pending") {
      return 0;
    }

    const plan = await this.subscriptionPlanRepository.findById(
      subscription.planId,
    );

    if (!plan) {
      return 0;
    }

    if (plan.isFree) {
      if (subscription.isTrialActive) {
        return null;
      }
      return 5;
    }

    return null;
  }

  async canLiftAnonymity(organizationId: string): Promise<boolean> {
    const subscription =
      await this.subscriptionRepository.findActiveByOrganizationId(
        organizationId,
      );

    if (!subscription) {
      return false;
    }

    if (subscription.status === "pending") {
      return false;
    }

    const plan = await this.subscriptionPlanRepository.findById(
      subscription.planId,
    );

    if (!plan) {
      return false;
    }

    return !plan.isFree;
  }
}
