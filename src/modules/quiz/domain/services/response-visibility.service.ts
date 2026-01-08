import { ResponseEntity } from "../entities/response.entity";
import { SubscriptionEntity } from "src/modules/subscription/domain/entities/subscription.entity";
import { SubscriptionPlanEntity } from "src/modules/subscription/domain/entities/subscription-plan.entity";

export interface VisibilityStats {
  visible: number;
  hidden: number;
}

export class ResponseVisibilityService {
  calculateVisibilityStats(
    responses: ResponseEntity[],
    subscription: SubscriptionEntity | null,
    plan: SubscriptionPlanEntity | null,
  ): VisibilityStats {
    if (!subscription || !plan) {
      return {
        visible: 0,
        hidden: responses.length,
      };
    }

    if (!subscription.isActive) {
      return {
        visible: 0,
        hidden: responses.length,
      };
    }

    if (plan.isFree) {
      if (subscription.isTrialActive) {
        return {
          visible: responses.length,
          hidden: 0,
        };
      }
      const maxVisible = 5;
      const visible = Math.min(maxVisible, responses.length);
      const hidden = Math.max(0, responses.length - maxVisible);
      return {
        visible,
        hidden,
      };
    }

    return {
      visible: responses.length,
      hidden: 0,
    };
  }

  getVisibleResponses(
    responses: ResponseEntity[],
    subscription: SubscriptionEntity | null,
    plan: SubscriptionPlanEntity | null,
  ): ResponseEntity[] {
    const stats = this.calculateVisibilityStats(responses, subscription, plan);

    if (stats.hidden === 0) {
      return responses;
    }

    const sortedResponses = [...responses].sort(
      (a, b) => a.submittedAt.getTime() - b.submittedAt.getTime(),
    );

    return sortedResponses.slice(0, stats.visible);
  }

  getHiddenResponses(
    responses: ResponseEntity[],
    subscription: SubscriptionEntity | null,
    plan: SubscriptionPlanEntity | null,
  ): ResponseEntity[] {
    const stats = this.calculateVisibilityStats(responses, subscription, plan);

    if (stats.hidden === 0) {
      return [];
    }

    const sortedResponses = [...responses].sort(
      (a, b) => a.submittedAt.getTime() - b.submittedAt.getTime(),
    );

    return sortedResponses.slice(stats.visible);
  }
}
