import { BaseUseCase, DomainError, IUseCase } from "src/core";
import type { ILoggerService } from "src/core";
import type { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import { SubscriptionEntity } from "../../domain/entities/subscription.entity";
import type { StripeSubscription } from "../../../payment/domain/types/stripe.types";

export interface SyncSubscriptionFromStripeInput {
  stripeSubscription: StripeSubscription;
}

export interface SyncSubscriptionFromStripeOutput {
  subscription: SubscriptionEntity;
}

export class SyncSubscriptionFromStripeUseCase
  extends BaseUseCase
  implements
    IUseCase<SyncSubscriptionFromStripeInput, SyncSubscriptionFromStripeOutput>
{
  constructor(
    logger: ILoggerService,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {
    super(logger);
  }

  async execute(
    input: SyncSubscriptionFromStripeInput,
  ): Promise<SyncSubscriptionFromStripeOutput> {
    const { stripeSubscription } = input;

    try {
      let subscription =
        await this.subscriptionRepository.findByStripeSubscriptionId(
          stripeSubscription.id,
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
            { stripeSubscriptionId: stripeSubscription.id },
          );
        }

        if (!subscription.stripeSubscriptionId) {
          subscription.linkToStripe(
            stripeSubscription.id,
            typeof stripeSubscription.customer === "string"
              ? stripeSubscription.customer
              : stripeSubscription.customer.id,
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
          if (
            stripeSubscription.canceled_at &&
            stripeSubscription.current_period_end
          ) {
            const canceledAt = new Date(stripeSubscription.canceled_at * 1000);
            const periodEnd = new Date(
              stripeSubscription.current_period_end * 1000,
            );
            const timeDiff = Math.abs(
              canceledAt.getTime() - periodEnd.getTime(),
            );
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            if (hoursDiff <= 24) {
              newStatus = "expired";
            } else {
              newStatus = "cancelled";
            }
          } else {
            newStatus = "cancelled";
          }
          break;
        case "unpaid":
          newStatus = "expired";
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
        } else if (newStatus === "expired") {
          subscription.expire();
        } else {
          (subscription as any).props.status = newStatus;
          (subscription as any).props.updatedAt = new Date();
        }
      }

      if (stripeSubscription.current_period_start) {
        (subscription as any).props.currentPeriodStart = new Date(
          stripeSubscription.current_period_start * 1000,
        );
      }

      if (stripeSubscription.current_period_end) {
        (subscription as any).props.currentPeriodEnd = new Date(
          stripeSubscription.current_period_end * 1000,
        );
      }

      if (!subscription.currentPeriodStart || !subscription.currentPeriodEnd) {
        this.logger.warn(
          `Subscription ${subscription.id} has missing period dates after Stripe sync; applying domain defaults`,
        );
        try {
          subscription.activate();
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          this.logger.error(
            `Failed to activate subscription ${subscription.id} while fixing missing period dates: ${msg}`,
            e instanceof Error ? e.stack || "" : "",
          );
        }
      }

      if (stripeSubscription.items?.data?.[0]?.quantity) {
        const stripeQuantity = stripeSubscription.items.data[0].quantity;

        const now = new Date();
        if (
          subscription.currentPeriodEnd &&
          subscription.currentPeriodEnd <= now
        ) {
          if (subscription.pendingQuantity !== null) {
            (subscription as any).props.quantity = subscription.pendingQuantity;
            (subscription as any).props.pendingQuantity = null;
          }
        }

        if (
          stripeQuantity !== subscription.quantity &&
          subscription.pendingQuantity === null
        ) {
          // Only update quantity from Stripe if there's no pending quantity
          // This prevents overwriting pendingQuantity that's waiting for payment
          (subscription as any).props.quantity = stripeQuantity;
        } else if (
          subscription.pendingQuantity !== null &&
          stripeQuantity === subscription.pendingQuantity
        ) {
          // If Stripe quantity matches pendingQuantity, it means payment was processed
          // Don't update yet, wait for payment webhook to handle it
          this.logger.info(
            `Stripe quantity (${stripeQuantity}) matches pendingQuantity (${subscription.pendingQuantity}) for subscription ${subscription.id}. Waiting for payment confirmation.`,
          );
        }
      }

      if (stripeSubscription.cancel_at_period_end !== undefined) {
        if (stripeSubscription.cancel_at_period_end) {
          if (
            !subscription.cancelledAt ||
            subscription.cancelledAt > subscription.currentPeriodEnd!
          ) {
            (subscription as any).props.cancelledAt =
              subscription.currentPeriodEnd;
          }
        } else {
          if (
            subscription.cancelledAt &&
            subscription.cancelledAt > new Date()
          ) {
            (subscription as any).props.cancelledAt = null;
            if (subscription.status === "cancelled") {
              (subscription as any).props.status = "active";
            }
          }
        }
      }

      if (
        stripeSubscription.canceled_at &&
        (stripeStatus === "canceled" || stripeStatus === "unpaid")
      ) {
        (subscription as any).props.cancelledAt = new Date(
          stripeSubscription.canceled_at * 1000,
        );
      }

      subscription = await this.subscriptionRepository.save(subscription);

      this.logger.info(
        `Subscription ${subscription.id} synchronized from Stripe subscription ${stripeSubscription.id}`,
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
