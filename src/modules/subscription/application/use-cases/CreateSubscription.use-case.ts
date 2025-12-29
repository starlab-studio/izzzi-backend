import { IUseCase, BaseUseCase, DomainError } from "src/core";
import type { ILoggerService } from "src/core";
import type { ISubscriptionPlanRepository } from "../../domain/repositories/subscription-plan.repository";
import type { IPricingTierRepository } from "../../domain/repositories/pricing-tier.repository";
import type { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import type { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { SubscriptionEntity } from "../../domain/entities/subscription.entity";
import { PricingTierEntity } from "../../domain/entities/pricing-tier.entity";
import { UserRole } from "src/core/domain/types";
import type { IPaymentService } from "../../domain/services/payment.service";
import type { IStripeSyncService } from "src/modules/payment/domain/services/stripe-sync.service";

export interface CreateSubscriptionInput {
  userId: string;
  organizationId: string;
  planId: string;
  quantity: number;
  billingPeriod?: "monthly" | "annual";
}

export interface CreateSubscriptionOutput {
  subscription: {
    id: string;
    planId: string;
    planName: string;
    status: string;
    quantity: number;
    totalPriceCents: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEnd: Date | null;
  };
  requiresPayment: boolean;
  stripeClientSecret?: string;
  stripeCheckoutUrl?: string;
}

export class CreateSubscriptionUseCase
  extends BaseUseCase
  implements IUseCase<CreateSubscriptionInput, CreateSubscriptionOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
    private readonly pricingTierRepository: IPricingTierRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly userRepository: IUserRepository,
    private readonly paymentService: IPaymentService,
    private readonly stripeSyncService: IStripeSyncService
  ) {
    super(logger);
  }

  async execute(
    input: CreateSubscriptionInput
  ): Promise<CreateSubscriptionOutput> {
    try {
      const {
        userId,
        organizationId,
        planId,
        quantity,
        billingPeriod = "monthly",
      } = input;

      if (quantity < 1 || quantity > 20) {
        throw new DomainError(
          "INVALID_CLASS_COUNT",
          "Le nombre de classes doit être entre 1 et 20",
          { quantity }
        );
      }

      const user =
        await this.userRepository.findByIdWithActiveMemberships(userId);
      if (!user) {
        throw new DomainError("USER_NOT_FOUND", "Utilisateur non trouvé");
      }

      if (!user.hasRoleInOrganization(organizationId, UserRole.ADMIN)) {
        throw new DomainError(
          "INSUFFICIENT_PERMISSIONS",
          "Vous devez être administrateur de cette organisation pour créer une subscription",
          { userId, organizationId }
        );
      }

      const existingSubscription =
        await this.subscriptionRepository.findActiveByOrganizationId(
          organizationId
        );
      if (existingSubscription) {
        throw new DomainError(
          "SUBSCRIPTION_ALREADY_EXISTS",
          "Cette organisation a déjà une subscription active",
          {
            organizationId,
            existingSubscriptionId: existingSubscription.id,
          }
        );
      }

      const plan = await this.subscriptionPlanRepository.findById(planId);
      if (!plan) {
        throw new DomainError(
          "PLAN_NOT_FOUND",
          "Le plan de subscription n'existe pas",
          { planId }
        );
      }

      if (!plan.isActive) {
        throw new DomainError(
          "PLAN_NOT_ACTIVE",
          "Le plan de subscription n'est pas actif",
          { planId }
        );
      }

      let tiers =
        await this.pricingTierRepository.findByPlanIdAndBillingPeriod(
          planId,
          billingPeriod
        );

      // For free plans, create missing pricing tiers if they don't exist
      if (plan.isFree && tiers.length === 0) {
        this.logger.info(
          `Creating missing pricing tiers for free plan ${plan.name} (${planId}) with billing period ${billingPeriod}`
        );

        const freeTier = PricingTierEntity.create({
          planId,
          billingPeriod,
          minClasses: 1,
          maxClasses: 20,
          pricePerClassCents: 0,
          stripePriceId: null,
        });

        const savedTier = await this.pricingTierRepository.save(freeTier);

        // Sync with Stripe to get stripePriceId
        if (plan.stripeProductId) {
          const tierToPriceIdMap =
            await this.stripeSyncService.syncPricingTiersToStripe(
              plan.stripeProductId,
              [savedTier]
            );

          const priceId = tierToPriceIdMap.get(savedTier.id);
          if (priceId) {
            const updatedTier = PricingTierEntity.reconstitute({
              ...savedTier.toPersistence(),
              stripePriceId: priceId,
            });
            const finalTier = await this.pricingTierRepository.save(updatedTier);
            tiers = [finalTier];
          } else {
            tiers = [savedTier];
          }
        } else {
          tiers = [savedTier];
        }
      }

      if (tiers.length === 0) {
        throw new DomainError(
          "NO_PRICING_TIERS",
          "Aucun palier de tarification trouvé pour ce plan",
          { planId, billingPeriod }
        );
      }

      let pricePerClassCents = 0;
      let selectedTier: PricingTierEntity | null = null;
      if (tiers.length > 0) {
        selectedTier =
          tiers.find(
            (t) => quantity >= t.minClasses && quantity <= t.maxClasses
          ) || null;

        if (!selectedTier) {
          throw new DomainError(
            "TIER_NOT_FOUND",
            `Aucun palier de tarification trouvé pour ${quantity} classe(s)`,
            {
              planId,
              billingPeriod,
              quantity,
              availableTiers: tiers.map((t) => ({
                min: t.minClasses,
                max: t.maxClasses,
              })),
            }
          );
        }

        pricePerClassCents = selectedTier.pricePerClassCents;

        // For free plans, sync tier with Stripe if stripePriceId is missing
        if (plan.isFree && selectedTier && !selectedTier.stripePriceId) {
          this.logger.info(
            `Syncing pricing tier ${selectedTier.id} with Stripe for free plan`
          );

          if (plan.stripeProductId) {
            const tierToPriceIdMap =
              await this.stripeSyncService.syncPricingTiersToStripe(
                plan.stripeProductId,
                [selectedTier]
              );

            const priceId = tierToPriceIdMap.get(selectedTier.id);
            if (priceId) {
              const updatedTier = PricingTierEntity.reconstitute({
                ...selectedTier.toPersistence(),
                stripePriceId: priceId,
              });
              await this.pricingTierRepository.save(updatedTier);
              selectedTier = updatedTier;
            }
          }
        }
      }

      const totalPriceCents = pricePerClassCents * quantity;
      const requiresPayment = !plan.isFree && totalPriceCents > 0;
      const isFreePlan = plan.isFree || totalPriceCents === 0;

      let trialDays: number | undefined;
      if (plan.trialPeriodDays > 0) {
        trialDays = plan.trialPeriodDays;
      }

      let savedSubscription: SubscriptionEntity;
      let stripeClientSecret: string | null = null;
      let stripeSubscriptionId: string | null = null;
      let stripeCustomerId: string | null = null;

      // For free plans, we still create a Stripe subscription to track invoices
      if (requiresPayment || isFreePlan) {
        const pendingSubscription = isFreePlan
          ? SubscriptionEntity.create({
              userId,
              organizationId,
              planId,
              billingPeriod,
              quantity,
              trialDays,
            })
          : SubscriptionEntity.createPending({
              userId,
              organizationId,
              planId,
              billingPeriod,
              quantity,
            });

        savedSubscription =
          await this.subscriptionRepository.save(pendingSubscription);

        const userEmail = user.email;
        const userName = `${user.firstName} ${user.lastName}`.trim();

        stripeCustomerId = await this.paymentService.getOrCreateCustomer(
          organizationId,
          userEmail,
          userName
        );

        if (!selectedTier?.stripePriceId) {
          throw new DomainError(
            "STRIPE_PRICE_ID_MISSING",
            "Le palier de tarification n'a pas de stripePriceId configuré",
            { tierId: selectedTier?.id, planId, billingPeriod }
          );
        }

        const stripeSubscription = await this.paymentService.createSubscription(
          {
            customerId: stripeCustomerId,
            priceId: selectedTier.stripePriceId,
            quantity,
            trialDays,
            metadata: {
              subscriptionId: savedSubscription.id,
              userId,
              organizationId,
              planId,
            },
          }
        );

        stripeSubscriptionId = stripeSubscription.subscriptionId;
        stripeClientSecret = stripeSubscription.clientSecret;

        savedSubscription.linkToStripe(stripeSubscriptionId, stripeCustomerId);
        savedSubscription =
          await this.subscriptionRepository.save(savedSubscription);
      } else {
        const subscription = SubscriptionEntity.create({
          userId,
          organizationId,
          planId,
          billingPeriod,
          quantity,
          trialDays,
        });

        savedSubscription =
          await this.subscriptionRepository.save(subscription);
      }

      return {
        subscription: {
          id: savedSubscription.id,
          planId: savedSubscription.planId,
          planName: plan.name,
          status: savedSubscription.status,
          quantity: savedSubscription.quantity,
          totalPriceCents,
          currentPeriodStart:
            savedSubscription.currentPeriodStart || new Date(),
          currentPeriodEnd: savedSubscription.currentPeriodEnd || new Date(),
          trialEnd: savedSubscription.trialEndDate,
        },
        requiresPayment,
        stripeClientSecret: stripeClientSecret || undefined,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
