import { BaseUseCase, IUseCase } from "src/core";
import type { ILoggerService } from "src/core";
import type { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";

export interface CheckBillingAccessInput {
  organizationId: string;
}

export interface CheckBillingAccessOutput {
  hasAccess: boolean;
}

export class CheckBillingAccessUseCase
  extends BaseUseCase
  implements IUseCase<CheckBillingAccessInput, CheckBillingAccessOutput>
{
  constructor(
    logger: ILoggerService,
    private readonly subscriptionRepository: ISubscriptionRepository
  ) {
    super(logger);
  }

  async execute(
    input: CheckBillingAccessInput
  ): Promise<CheckBillingAccessOutput> {
    const { organizationId } = input;

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
        return {
          hasAccess: false,
        };
      }

      return {
        hasAccess: !!subscription.stripeCustomerId,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
