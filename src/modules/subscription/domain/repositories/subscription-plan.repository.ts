import { IRepository } from "src/core";
import { SubscriptionPlanEntity } from "../entities/subscription-plan.entity";

export interface ISubscriptionPlanRepository
  extends IRepository<SubscriptionPlanEntity> {
  findAllActive(): Promise<SubscriptionPlanEntity[]>;
  findByName(name: string): Promise<SubscriptionPlanEntity | null>;
  findById(id: string): Promise<SubscriptionPlanEntity | null>;
}

export const SUBSCRIPTION_PLAN_REPOSITORY = Symbol(
  "ISubscriptionPlanRepository"
);
