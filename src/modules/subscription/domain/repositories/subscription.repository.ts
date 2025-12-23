import { IRepository } from "src/core";
import { SubscriptionEntity } from "../entities/subscription.entity";

export interface ISubscriptionRepository
  extends IRepository<SubscriptionEntity> {
  findByUserId(userId: string): Promise<SubscriptionEntity | null>;
  findByOrganizationId(
    organizationId: string
  ): Promise<SubscriptionEntity | null>;
  findByStripeSubscriptionId(
    stripeSubId: string
  ): Promise<SubscriptionEntity | null>;
  findActiveByOrganizationId(
    organizationId: string
  ): Promise<SubscriptionEntity | null>;
  findAllActive(): Promise<SubscriptionEntity[]>;
  findExpiring(beforeDate: Date): Promise<SubscriptionEntity[]>;
}

export const SUBSCRIPTION_REPOSITORY = Symbol("ISubscriptionRepository");
