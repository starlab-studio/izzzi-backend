import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerService, ILoggerService } from "src/core";
import { CoreModule } from "src/core/core.module";
import { OrganizationModule } from "../organization";
import { IUserRepository } from "../organization/domain/repositories/user.repository";
import { UserRepository } from "../organization/infrastructure/repositories/user.repository";

import { SubscriptionPlanModel } from "./infrastructure/models/subscription-plan.model";
import { PlanFeatureModel } from "./infrastructure/models/plan-feature.model";
import { PricingTierModel } from "./infrastructure/models/pricing-tier.model";
import { UserSubscriptionModel } from "./infrastructure/models/user-subscription.model";

import { SubscriptionPlanRepository } from "./infrastructure/repositories/subscription-plan.repository";
import { PlanFeatureRepository } from "./infrastructure/repositories/plan-feature.repository";
import { PricingTierRepository } from "./infrastructure/repositories/pricing-tier.repository";
import { SubscriptionRepository } from "./infrastructure/repositories/subscription.repository";

import { ISubscriptionPlanRepository } from "./domain/repositories/subscription-plan.repository";
import { IPlanFeatureRepository } from "./domain/repositories/plan-feature.repository";
import { IPricingTierRepository } from "./domain/repositories/pricing-tier.repository";
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from "./domain/repositories/subscription.repository";

import { GetPricingPlansUseCase } from "./application/use-cases/GetPricingPlans.use-case";
import { GetPricingTiersUseCase } from "./application/use-cases/GetPricingTiers.use-case";
import { CalculateSubscriptionPriceUseCase } from "./application/use-cases/CalculateSubscriptionPrice.use-case";
import { CreateSubscriptionUseCase } from "./application/use-cases/CreateSubscription.use-case";
import { UpdateSubscriptionQuantityUseCase } from "./application/use-cases/UpdateSubscriptionQuantity.use-case";
import { CancelSubscriptionUseCase } from "./application/use-cases/CancelSubscription.use-case";
import { GetSubscriptionUseCase } from "./application/use-cases/GetSubscription.use-case";

import { SubscriptionFacade } from "./application/facades/subscription.facade";

import { SubscriptionController } from "./interface/controllers/subscription.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlanModel,
      PlanFeatureModel,
      PricingTierModel,
      UserSubscriptionModel,
    ]),
    CoreModule,
    forwardRef(() => OrganizationModule),
  ],
  controllers: [SubscriptionController],
  providers: [
    LoggerService,
    SubscriptionPlanRepository,
    PlanFeatureRepository,
    PricingTierRepository,
    SubscriptionRepository,
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useClass: SubscriptionRepository,
    },
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
      inject: [
        LoggerService,
        SubscriptionPlanRepository,
        PlanFeatureRepository,
      ],
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
      provide: CalculateSubscriptionPriceUseCase,
      useFactory: (
        logger: ILoggerService,
        subscriptionPlanRepository: ISubscriptionPlanRepository,
        pricingTierRepository: IPricingTierRepository
      ) =>
        new CalculateSubscriptionPriceUseCase(
          logger,
          subscriptionPlanRepository,
          pricingTierRepository
        ),
      inject: [
        LoggerService,
        SubscriptionPlanRepository,
        PricingTierRepository,
      ],
    },
    {
      provide: CreateSubscriptionUseCase,
      useFactory: (
        logger: ILoggerService,
        subscriptionPlanRepository: ISubscriptionPlanRepository,
        pricingTierRepository: IPricingTierRepository,
        subscriptionRepository: ISubscriptionRepository,
        userRepository: IUserRepository
      ) =>
        new CreateSubscriptionUseCase(
          logger,
          subscriptionPlanRepository,
          pricingTierRepository,
          subscriptionRepository,
          userRepository
        ),
      inject: [
        LoggerService,
        SubscriptionPlanRepository,
        PricingTierRepository,
        SubscriptionRepository,
        UserRepository,
      ],
    },
    {
      provide: UpdateSubscriptionQuantityUseCase,
      useFactory: (
        logger: ILoggerService,
        subscriptionRepository: ISubscriptionRepository,
        subscriptionPlanRepository: ISubscriptionPlanRepository,
        pricingTierRepository: IPricingTierRepository,
        userRepository: IUserRepository
      ) =>
        new UpdateSubscriptionQuantityUseCase(
          logger,
          subscriptionRepository,
          subscriptionPlanRepository,
          pricingTierRepository,
          userRepository
        ),
      inject: [
        LoggerService,
        SubscriptionRepository,
        SubscriptionPlanRepository,
        PricingTierRepository,
        UserRepository,
      ],
    },
    {
      provide: CancelSubscriptionUseCase,
      useFactory: (
        logger: ILoggerService,
        subscriptionRepository: ISubscriptionRepository,
        userRepository: IUserRepository
      ) =>
        new CancelSubscriptionUseCase(
          logger,
          subscriptionRepository,
          userRepository
        ),
      inject: [LoggerService, SubscriptionRepository, UserRepository],
    },
    {
      provide: GetSubscriptionUseCase,
      useFactory: (
        logger: ILoggerService,
        subscriptionRepository: ISubscriptionRepository,
        subscriptionPlanRepository: ISubscriptionPlanRepository,
        pricingTierRepository: IPricingTierRepository,
        planFeatureRepository: IPlanFeatureRepository,
        userRepository: IUserRepository
      ) =>
        new GetSubscriptionUseCase(
          logger,
          subscriptionRepository,
          subscriptionPlanRepository,
          pricingTierRepository,
          planFeatureRepository,
          userRepository
        ),
      inject: [
        LoggerService,
        SubscriptionRepository,
        SubscriptionPlanRepository,
        PricingTierRepository,
        PlanFeatureRepository,
        UserRepository,
      ],
    },
    {
      provide: SubscriptionFacade,
      useFactory: (
        getPricingPlansUseCase: GetPricingPlansUseCase,
        getPricingTiersUseCase: GetPricingTiersUseCase,
        calculateSubscriptionPriceUseCase: CalculateSubscriptionPriceUseCase,
        createSubscriptionUseCase: CreateSubscriptionUseCase,
        updateSubscriptionQuantityUseCase: UpdateSubscriptionQuantityUseCase,
        cancelSubscriptionUseCase: CancelSubscriptionUseCase,
        getSubscriptionUseCase: GetSubscriptionUseCase
      ) =>
        new SubscriptionFacade(
          getPricingPlansUseCase,
          getPricingTiersUseCase,
          calculateSubscriptionPriceUseCase,
          createSubscriptionUseCase,
          updateSubscriptionQuantityUseCase,
          cancelSubscriptionUseCase,
          getSubscriptionUseCase
        ),
      inject: [
        GetPricingPlansUseCase,
        GetPricingTiersUseCase,
        CalculateSubscriptionPriceUseCase,
        CreateSubscriptionUseCase,
        UpdateSubscriptionQuantityUseCase,
        CancelSubscriptionUseCase,
        GetSubscriptionUseCase,
      ],
    },
  ],
  exports: [SubscriptionFacade],
})
export class SubscriptionModule {}
