import { IRepository } from "src/core";
import { PlanFeatureEntity } from "../entities/plan-feature.entity";

export interface IPlanFeatureRepository extends IRepository<PlanFeatureEntity> {
  findByPlanId(planId: string): Promise<PlanFeatureEntity[]>;
}
