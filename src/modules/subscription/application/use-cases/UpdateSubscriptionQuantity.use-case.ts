import {
  IUseCase,
  ILoggerService,
  BaseUseCase,
  DomainError,
  IEventStore,
} from "src/core";
import { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "../../domain/repositories/subscription-plan.repository";
import { IPricingTierRepository } from "../../domain/repositories/pricing-tier.repository";
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { UserRole } from "src/core/domain/types";
import type { IStripeSyncService } from "src/modules/payment/domain/services/stripe-sync.service";
import { SubscriptionUpgradedEvent } from "../../domain/events/subscription-upgraded.event";

export interface UpdateQuantityInput {
  subscriptionId: string;
  newQuantity: number;
  organizationId: string;
  userId: string;
}

export interface UpdateQuantityOutput {
  subscription: {
    id: string;
    planId: string;
    planName: string;
    status: string;
    quantity: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  };
  previousQuantity: number;
  newQuantity: number;
  previousPriceCents: number;
  newPriceCents: number;
  priceDifferenceCents: number;
  isUpgrade: boolean;
  effectiveDate: Date;
  prorationApplied: boolean;
  requiresPayment: boolean;
  amountDueCents?: number;
  stripeClientSecret?: string;
  billingPeriod: "monthly" | "annual";
}

export class UpdateSubscriptionQuantityUseCase
  extends BaseUseCase
  implements IUseCase<UpdateQuantityInput, UpdateQuantityOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
    private readonly pricingTierRepository: IPricingTierRepository,
    private readonly userRepository: IUserRepository,
    private readonly stripeSyncService: IStripeSyncService,
    private readonly eventStore: IEventStore
  ) {
    super(logger);
  }

  async execute(input: UpdateQuantityInput): Promise<UpdateQuantityOutput> {
    try {
      const { subscriptionId, newQuantity, organizationId, userId } = input;

      if (newQuantity < 1 || newQuantity > 20) {
        throw new DomainError(
          "INVALID_CLASS_COUNT",
          "Number of classes must be between 1 and 20",
          { newQuantity }
        );
      }

      const user =
        await this.userRepository.findByIdWithActiveMemberships(userId);
      if (!user) {
        throw new DomainError("USER_NOT_FOUND", "User not found");
      }

      if (!user.hasRoleInOrganization(organizationId, UserRole.ADMIN)) {
        throw new DomainError(
          "INSUFFICIENT_PERMISSIONS",
          "You must be an administrator of this organization to modify the subscription",
          { userId, organizationId }
        );
      }

      const subscription =
        await this.subscriptionRepository.findById(subscriptionId);
      if (!subscription) {
        throw new DomainError(
          "SUBSCRIPTION_NOT_FOUND",
          "Subscription not found",
          { subscriptionId }
        );
      }

      if (subscription.organizationId !== organizationId) {
        throw new DomainError(
          "SUBSCRIPTION_ORGANIZATION_MISMATCH",
          "Subscription does not belong to this organisation",
          { subscriptionId, organizationId }
        );
      }

      if (!subscription.isActive) {
        throw new DomainError(
          "SUBSCRIPTION_NOT_ACTIVE",
          "Only active subscription can be update",
          { subscriptionId, status: subscription.status }
        );
      }

      if (subscription.quantity === newQuantity) {
        throw new DomainError(
          "QUANTITY_UNCHANGED",
          "New quantity is identical to current quantity",
          { quantity: newQuantity }
        );
      }

      const previousQuantity = subscription.quantity;
      const isUpgrade = newQuantity > previousQuantity;

      const plan = await this.subscriptionPlanRepository.findById(
        subscription.planId
      );
      if (!plan) {
        throw new DomainError(
          "PLAN_NOT_FOUND",
          "Subscription plan does not exist",
          { planId: subscription.planId }
        );
      }

      let previousPriceCents = 0;
      let newPriceCents = 0;

      if (!plan.isFree) {
        const tiers =
          await this.pricingTierRepository.findByPlanIdAndBillingPeriod(
            subscription.planId,
            subscription.billingPeriod
          );

        if (tiers.length === 0) {
          throw new DomainError(
            "NO_PRICING_TIERS",
            "No pricing tier found for this plan",
            {
              planId: subscription.planId,
              billingPeriod: subscription.billingPeriod,
            }
          );
        }

        const previousTier = tiers.find(
          (t) =>
            previousQuantity >= t.minClasses && previousQuantity <= t.maxClasses
        );
        const newTier = tiers.find(
          (t) => newQuantity >= t.minClasses && newQuantity <= t.maxClasses
        );

        if (!previousTier) {
          throw new DomainError(
            "TIER_NOT_FOUND",
            `No pricing tier found for ${previousQuantity} class(es)`,
            {
              planId: subscription.planId,
              billingPeriod: subscription.billingPeriod,
              quantity: previousQuantity,
            }
          );
        }

        if (!newTier) {
          throw new DomainError(
            "TIER_NOT_FOUND",
            `No pricing tier found for ${newQuantity} class(es)`,
            {
              planId: subscription.planId,
              billingPeriod: subscription.billingPeriod,
              quantity: newQuantity,
            }
          );
        }

        previousPriceCents = previousTier.pricePerClassCents * previousQuantity;
        newPriceCents = newTier.pricePerClassCents * newQuantity;
      }

      const priceDifferenceCents = newPriceCents - previousPriceCents;

      let prorationApplied = false;
      let amountDueCents = 0;
      let effectiveDate: Date;
      let requiresPayment = false;
      let stripeClientSecret: string | undefined = undefined;

      if (isUpgrade) {
        effectiveDate = new Date();
        prorationApplied = true;

        const periodStart = subscription.currentPeriodStart!;
        const periodEnd = subscription.currentPeriodEnd!;
        const totalDaysInPeriod =
          (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
        const daysRemaining =
          (periodEnd.getTime() - effectiveDate.getTime()) /
          (1000 * 60 * 60 * 24);

        if (totalDaysInPeriod > 0 && daysRemaining > 0) {
          const prorationRatio = daysRemaining / totalDaysInPeriod;
          amountDueCents = Math.round(priceDifferenceCents * prorationRatio);
          requiresPayment = amountDueCents > 0;
        } else {
          amountDueCents = priceDifferenceCents;
          requiresPayment = amountDueCents > 0;
        }

        if (subscription.stripeSubscriptionId && !plan.isFree) {
          const tiers =
            await this.pricingTierRepository.findByPlanIdAndBillingPeriod(
              subscription.planId,
              subscription.billingPeriod
            );
          const newTier = tiers.find(
            (t) => newQuantity >= t.minClasses && newQuantity <= t.maxClasses
          );

          if (!newTier?.stripePriceId) {
            throw new DomainError(
              "STRIPE_PRICE_ID_MISSING",
              "Pricing tier does not have a Stripe price ID configured",
              {
                tierId: newTier?.id,
                planId: subscription.planId,
                billingPeriod: subscription.billingPeriod,
              }
            );
          }

          await this.stripeSyncService.updateSubscriptionQuantity(
            subscription.stripeSubscriptionId,
            newQuantity,
            newTier.stripePriceId,
            {
              prorationBehavior: "create_prorations",
            }
          );

          if (
            requiresPayment &&
            amountDueCents > 0 &&
            subscription.stripeCustomerId
          ) {
            const paymentIntent =
              await this.stripeSyncService.createPaymentIntent({
                customerId: subscription.stripeCustomerId,
                amountCents: amountDueCents,
                currency: "eur",
                createInvoice: true,
                description: `Quantity update: ${previousQuantity} → ${newQuantity} classes`,
                metadata: {
                  subscriptionId: subscription.id,
                  organizationId: subscription.organizationId,
                  userId: subscription.userId,
                  type: "quantity_update",
                  previousQuantity: previousQuantity.toString(),
                  newQuantity: newQuantity.toString(),
                },
              });

            stripeClientSecret = paymentIntent.clientSecret;
          }
        }

        subscription.updateQuantity(newQuantity, true);
      } else {
        effectiveDate = subscription.currentPeriodEnd!;
        prorationApplied = false;
        requiresPayment = false;
        amountDueCents = 0;

        if (subscription.stripeSubscriptionId && !plan.isFree) {
          const tiers =
            await this.pricingTierRepository.findByPlanIdAndBillingPeriod(
              subscription.planId,
              subscription.billingPeriod
            );
          const newTier = tiers.find(
            (t) => newQuantity >= t.minClasses && newQuantity <= t.maxClasses
          );

          if (!newTier?.stripePriceId) {
            throw new DomainError(
              "STRIPE_PRICE_ID_MISSING",
              "Pricing tier does not have a Stripe price ID configured",
              {
                tierId: newTier?.id,
                planId: subscription.planId,
                billingPeriod: subscription.billingPeriod,
              }
            );
          }

          await this.stripeSyncService.updateSubscriptionQuantity(
            subscription.stripeSubscriptionId,
            newQuantity,
            newTier.stripePriceId,
            {
              prorationBehavior: "none",
            }
          );
        }

        subscription.updateQuantity(newQuantity, false);
      }

      const savedSubscription =
        await this.subscriptionRepository.save(subscription);

      const planName = plan.name === "super-izzzi" ? "Super Izzzi" : "Izzzi";

      // Emit upgrade event if upgrade occurred and no payment is required
      if (isUpgrade) {
        const user = await this.userRepository.findById(subscription.userId);
        if (user) {
          this.eventStore.publish(
            new SubscriptionUpgradedEvent({
              userId: subscription.userId,
              userEmail: user.email,
              organizationId: subscription.organizationId,
              planName,
              previousQuantity,
              newQuantity,
              previousPriceCents,
              newPriceCents,
            })
          );
        }
      }

      const displayQuantity =
        savedSubscription.pendingQuantity !== null
          ? savedSubscription.pendingQuantity
          : savedSubscription.quantity;

      return {
        subscription: {
          id: savedSubscription.id,
          planId: savedSubscription.planId,
          planName,
          status: savedSubscription.status,
          quantity: displayQuantity,
          currentPeriodStart: savedSubscription.currentPeriodStart!,
          currentPeriodEnd: savedSubscription.currentPeriodEnd!,
        },
        previousQuantity,
        newQuantity,
        previousPriceCents,
        newPriceCents,
        priceDifferenceCents,
        isUpgrade,
        effectiveDate,
        prorationApplied,
        requiresPayment,
        amountDueCents: requiresPayment ? amountDueCents : undefined,
        stripeClientSecret: requiresPayment ? stripeClientSecret : undefined,
        billingPeriod: subscription.billingPeriod,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
