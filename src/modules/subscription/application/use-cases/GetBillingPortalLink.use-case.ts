import { BaseUseCase, DomainError, IUseCase } from "src/core";
import type { ILoggerService } from "src/core";
import type { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import type { IStripeSyncService } from "../../../payment/domain/services/stripe-sync.service";
import { OrganizationAuthorizationService } from "src/modules/organization/domain/services/organization-authorization.service";

export interface GetBillingPortalLinkInput {
  organizationId: string;
  userId: string;
  returnUrl?: string;
}

export interface GetBillingPortalLinkOutput {
  url: string;
}

export class GetBillingPortalLinkUseCase
  extends BaseUseCase
  implements IUseCase<GetBillingPortalLinkInput, GetBillingPortalLinkOutput>
{
  constructor(
    logger: ILoggerService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly stripeSyncService: IStripeSyncService,
    private readonly organizationAuthorizationService: OrganizationAuthorizationService
  ) {
    super(logger);
  }

  async execute(
    input: GetBillingPortalLinkInput
  ): Promise<GetBillingPortalLinkOutput> {
    const { organizationId, userId, returnUrl } = input;

    try {
      let subscription =
        await this.subscriptionRepository.findActiveByOrganizationId(
          organizationId
        );

      if (!subscription) {
        subscription =
          await this.subscriptionRepository.findByOrganizationId(
            organizationId
          );
      }

      if (!subscription) {
        throw new DomainError(
          "SUBSCRIPTION_NOT_FOUND",
          "No subscription found for this organization",
          { organizationId }
        );
      }

      await this.organizationAuthorizationService.assertCanAccess(
        userId,
        organizationId
      );

      if (!subscription.stripeCustomerId) {
        throw new DomainError(
          "STRIPE_CUSTOMER_ID_MISSING",
          "Subscription does not have an associated Stripe customer",
          { subscriptionId: subscription.id }
        );
      }

      const portalUrl = await this.stripeSyncService.createBillingPortalSession(
        {
          customerId: subscription.stripeCustomerId,
          returnUrl:
            returnUrl ||
            `${process.env.FRONTEND_DOMAIN_URL || "http://localhost:3001"}/profile/admin`,
        }
      );

      return {
        url: portalUrl,
      };
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
