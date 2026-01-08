import { BaseUseCase, IUseCase, type ILoggerService } from "src/core";
import type { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import { SubscriptionEntity } from "../../domain/entities/subscription.entity";

export interface ApplyPendingQuantityInput {
  organizationId?: string;
}

export interface ApplyPendingQuantityOutput {
  appliedCount: number;
}

export class ApplyPendingQuantityUseCase
  extends BaseUseCase
  implements IUseCase<ApplyPendingQuantityInput, ApplyPendingQuantityOutput>
{
  constructor(
    logger: ILoggerService,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {
    super(logger);
  }

  async execute(
    input: ApplyPendingQuantityInput,
  ): Promise<ApplyPendingQuantityOutput> {
    const now = new Date();

    // Trouver tous les abonnements avec pendingQuantity dont la période se termine
    let subscriptions: (SubscriptionEntity | null)[];

    if (input.organizationId) {
      const subscription =
        await this.subscriptionRepository.findByOrganizationId(
          input.organizationId,
        );
      subscriptions = subscription ? [subscription] : [];
    } else {
      subscriptions = await this.subscriptionRepository.findAllActive();
    }

    const subscriptionsToUpdate = subscriptions.filter(
      (sub) =>
        sub !== null &&
        sub.pendingQuantity !== null &&
        sub.currentPeriodEnd &&
        sub.currentPeriodEnd <= now,
    ) as SubscriptionEntity[];

    let appliedCount = 0;

    for (const subscription of subscriptionsToUpdate) {
      const previousQuantity = subscription.quantity;
      const pendingQuantity = subscription.pendingQuantity;

      subscription.renewPeriod();
      await this.subscriptionRepository.save(subscription);

      appliedCount++;

      this.logger.info(
        `Applied pending quantity ${pendingQuantity} to subscription ${subscription.id} for organization ${subscription.organizationId}. Previous quantity: ${previousQuantity}, new quantity: ${subscription.quantity}`,
      );
    }

    return { appliedCount };
  }

  async withCompensation(): Promise<void> {
    // Pas de compensation nécessaire
  }
}
