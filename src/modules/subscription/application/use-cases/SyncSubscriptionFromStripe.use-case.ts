import { Injectable } from "@nestjs/common";
import { BaseUseCase, DomainError, IUseCase } from "src/core";
import type { ILoggerService } from "src/core";
import type { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import { SubscriptionEntity } from "../../domain/entities/subscription.entity";
import Stripe from "stripe";

export interface SyncSubscriptionFromStripeInput {
  stripeSubscription: Stripe.Subscription;
}

export interface SyncSubscriptionFromStripeOutput {
  subscription: SubscriptionEntity;
}

@Injectable()
export class SyncSubscriptionFromStripeUseCase
  extends BaseUseCase
  implements
    IUseCase<SyncSubscriptionFromStripeInput, SyncSubscriptionFromStripeOutput>
{
  constructor(
    logger: ILoggerService,
    private readonly subscriptionRepository: ISubscriptionRepository
  ) {
    super(logger);
  }

  async execute(
    input: SyncSubscriptionFromStripeInput
  ): Promise<SyncSubscriptionFromStripeOutput> {
    const { stripeSubscription } = input;

    try {
      let subscription =
        await this.subscriptionRepository.findByStripeSubscriptionId(
          stripeSubscription.id
        );

      if (!subscription) {
        const subscriptionId = stripeSubscription.metadata?.subscriptionId;
        if (subscriptionId) {
          subscription =
            await this.subscriptionRepository.findById(subscriptionId);
        }

        if (!subscription) {
          throw new DomainError(
            "SUBSCRIPTION_NOT_FOUND",
            "Subscription not found for this Stripe subscription",
            { stripeSubscriptionId: stripeSubscription.id }
          );
        }

        if (!subscription.stripeSubscriptionId) {
          subscription.linkToStripe(
            stripeSubscription.id,
            typeof stripeSubscription.customer === "string"
              ? stripeSubscription.customer
              : stripeSubscription.customer?.id || ""
          );
        }
      }

      const stripeStatus = stripeSubscription.status;
      let newStatus: SubscriptionEntity["status"];

      switch (stripeStatus) {
        case "active":
          newStatus = "active";
          break;
        case "trialing":
          newStatus = "trial";
          break;
        case "past_due":
          newStatus = "past_due";
          break;
        case "canceled":
        case "unpaid":
          newStatus = "cancelled";
          break;
        case "incomplete":
        case "incomplete_expired":
          newStatus = "failed";
          break;
        default:
          newStatus = subscription.status;
      }

      if (subscription.status !== newStatus) {
        if (newStatus === "active" && subscription.status === "pending") {
          subscription.activate();
        } else {
          (subscription as any).props.status = newStatus;
          (subscription as any).props.updatedAt = new Date();
        }
      }

      if (stripeSubscription.current_period_start) {
        (subscription as any).props.currentPeriodStart = new Date(
          stripeSubscription.current_period_start * 1000
        );
      }

      if (stripeSubscription.current_period_end) {
        (subscription as any).props.currentPeriodEnd = new Date(
          stripeSubscription.current_period_end * 1000
        );
      }

      if (
        stripeSubscription.canceled_at &&
        (stripeStatus === "canceled" || stripeStatus === "unpaid")
      ) {
        (subscription as any).props.cancelledAt = new Date(
          stripeSubscription.canceled_at * 1000
        );
      }

      subscription = await this.subscriptionRepository.save(subscription);

      this.logger.info(
        `Subscription ${subscription.id} synchronized from Stripe subscription ${stripeSubscription.id}`
      );

      return { subscription };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (error instanceof Error && error.stack) {
        this.logger.error(errorMessage, error.stack);
      } else {
        this.logger.warn(errorMessage);
      }
      throw error;
    }
  }

  async withCompensation(): Promise<void> {}
}
