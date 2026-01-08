import { IUseCase, ILoggerService, BaseUseCase, DomainError } from "src/core";
import { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { SubscriptionEntity } from "../../domain/entities/subscription.entity";
import { UserRole } from "src/core/domain/types";

export interface CancelSubscriptionInput {
  subscriptionId: string;
  organizationId: string;
  userId: string;
  immediate: boolean;
  reason?: string;
}

export interface CancelSubscriptionOutput {
  subscription: {
    id: string;
    planId: string;
    planName: string;
    status: string;
    quantity: number;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    cancelledAt: Date | null;
  };
  canceledAt: Date;
  effectiveDate: Date;
  wasImmediate: boolean;
  refundAmountCents: number;
}

export class CancelSubscriptionUseCase
  extends BaseUseCase
  implements IUseCase<CancelSubscriptionInput, CancelSubscriptionOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly userRepository: IUserRepository,
  ) {
    super(logger);
  }

  async execute(
    input: CancelSubscriptionInput,
  ): Promise<CancelSubscriptionOutput> {
    try {
      const { subscriptionId, organizationId, userId, immediate, reason } =
        input;

      const user =
        await this.userRepository.findByIdWithActiveMemberships(userId);
      if (!user) {
        throw new DomainError("USER_NOT_FOUND", "Utilisateur non trouvé");
      }

      if (!user.hasRoleInOrganization(organizationId, UserRole.ADMIN)) {
        throw new DomainError(
          "INSUFFICIENT_PERMISSIONS",
          "Vous devez être administrateur de cette organisation pour annuler la subscription",
          { userId, organizationId },
        );
      }

      const subscription =
        await this.subscriptionRepository.findById(subscriptionId);
      if (!subscription) {
        throw new DomainError(
          "SUBSCRIPTION_NOT_FOUND",
          "Subscription not found",
          { subscriptionId },
        );
      }

      if (subscription.organizationId !== organizationId) {
        throw new DomainError(
          "SUBSCRIPTION_ORGANIZATION_MISMATCH",
          "Subscription does not belong to this organisation",
          { subscriptionId, organizationId },
        );
      }

      if (subscription.isCancelled) {
        throw new DomainError(
          "SUBSCRIPTION_ALREADY_CANCELLED",
          "This subscription is already cancelled",
          { subscriptionId, status: subscription.status },
        );
      }

      if (!subscription.isActive && !subscription.isTrialing) {
        throw new DomainError(
          "SUBSCRIPTION_NOT_CANCELLABLE",
          "Only active or trialing subscriptions can be cancelled",
          { subscriptionId, status: subscription.status },
        );
      }

      const canceledAt = new Date();
      let effectiveDate: Date;
      let wasImmediate: boolean;

      if (immediate) {
        subscription.cancel();
        effectiveDate = canceledAt;
        wasImmediate = true;

        this.logger.info(
          `Subscription ${subscriptionId} cancelled immediately by user ${userId}. Organization: ${organizationId}. Reason: ${reason || "N/A"}`,
        );
      } else {
        const periodEnd = subscription.currentPeriodEnd;
        if (!periodEnd) {
          throw new DomainError(
            "INVALID_SUBSCRIPTION_STATE",
            "Cannot schedule cancellation: subscription has no period end date",
            { subscriptionId },
          );
        }

        subscription.scheduleCancellation();

        const subscriptionData = subscription.toPersistence();
        subscriptionData.cancelledAt = periodEnd;
        const updatedSubscription =
          SubscriptionEntity.reconstitute(subscriptionData);

        effectiveDate = periodEnd;
        wasImmediate = false;

        this.logger.info(
          `Subscription ${subscriptionId} scheduled for cancellation at end of period by user ${userId}. Organization: ${organizationId}. Effective date: ${effectiveDate.toISOString()}. Reason: ${reason || "N/A"}`,
        );

        const savedSubscription =
          await this.subscriptionRepository.save(updatedSubscription);
        const refundAmountCents = 0;

        return {
          subscription: {
            id: savedSubscription.id,
            planId: savedSubscription.planId,
            planName: "",
            status: savedSubscription.status,
            quantity: savedSubscription.quantity,
            currentPeriodStart: savedSubscription.currentPeriodStart,
            currentPeriodEnd: savedSubscription.currentPeriodEnd,
            cancelledAt: savedSubscription.cancelledAt,
          },
          canceledAt,
          effectiveDate,
          wasImmediate,
          refundAmountCents,
        };
      }

      const savedSubscription =
        await this.subscriptionRepository.save(subscription);

      const refundAmountCents = 0;

      return {
        subscription: {
          id: savedSubscription.id,
          planId: savedSubscription.planId,
          planName: "",
          status: savedSubscription.status,
          quantity: savedSubscription.quantity,
          currentPeriodStart: savedSubscription.currentPeriodStart,
          currentPeriodEnd: savedSubscription.currentPeriodEnd,
          cancelledAt: savedSubscription.cancelledAt,
        },
        canceledAt,
        effectiveDate,
        wasImmediate,
        refundAmountCents,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
