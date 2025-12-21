import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerService, ILoggerService } from "src/core";

import { SubscriptionPlanModel } from "./infrastructure/models/subscription-plan.model";
import { PlanFeatureModel } from "./infrastructure/models/plan-feature.model";
import { PricingTierModel } from "./infrastructure/models/pricing-tier.model";

import { SubscriptionPlanRepository } from "./infrastructure/repositories/subscription-plan.repository";
import { PlanFeatureRepository } from "./infrastructure/repositories/plan-feature.repository";
import { PricingTierRepository } from "./infrastructure/repositories/pricing-tier.repository";

import { ISubscriptionPlanRepository } from "./domain/repositories/subscription-plan.repository";
import { IPlanFeatureRepository } from "./domain/repositories/plan-feature.repository";
import { IPricingTierRepository } from "./domain/repositories/pricing-tier.repository";

import { GetPricingPlansUseCase } from "./application/use-cases/GetPricingPlans.use-case";
import { GetPricingTiersUseCase } from "./application/use-cases/GetPricingTiers.use-case";

import { SubscriptionFacade } from "./application/facades/subscription.facade";

import { SubscriptionController } from "./interface/controllers/subscription.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlanModel,
      PlanFeatureModel,
      PricingTierModel,
    ]),
  ],
  controllers: [SubscriptionController],
  providers: [
    LoggerService,
    SubscriptionPlanRepository,
    PlanFeatureRepository,
    PricingTierRepository,
    {
      provide: GetPricingPlansUseCase,
      useFactory: (
        logger: ILoggerService,
        subscriptionPlanRepository: ISubscriptionPlanRepository,
        planFeatureRepository: IPlanFeatureRepository
      ) =>
        new GetPricingPlansUseCase(
          logger,
          subscriptionPlanRepository,
          planFeatureRepository
        ),
      inject: [LoggerService, SubscriptionPlanRepository, PlanFeatureRepository],
    },
    {
      provide: GetPricingTiersUseCase,
      useFactory: (
        logger: ILoggerService,
        pricingTierRepository: IPricingTierRepository
      ) => new GetPricingTiersUseCase(logger, pricingTierRepository),
      inject: [LoggerService, PricingTierRepository],
    },
    {
      provide: SubscriptionFacade,
      useFactory: (
        getPricingPlansUseCase: GetPricingPlansUseCase,
        getPricingTiersUseCase: GetPricingTiersUseCase
      ) =>
        new SubscriptionFacade(
          getPricingPlansUseCase,
          getPricingTiersUseCase
        ),
      inject: [GetPricingPlansUseCase, GetPricingTiersUseCase],
    },
  ],
  exports: [SubscriptionFacade],
})
export class SubscriptionModule {}
