import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { OrganizationModel } from "../organization/infrastructure/models/organization.model";
import { UserModel } from "../organization/infrastructure/models/user.model";
import { MembershipModel } from "../organization/infrastructure/models/membership.model";
import { SubscriptionPlanModel } from "../subscription/infrastructure/models/subscription-plan.model";
import { UserSubscriptionModel } from "../subscription/infrastructure/models/user-subscription.model";
import { PlanFeatureModel } from "../subscription/infrastructure/models/plan-feature.model";
import { PricingTierModel } from "../subscription/infrastructure/models/pricing-tier.model";
import { ClassModel } from "../class/infrastructure/models/class.model";

import { SuperAdminFacade } from "./application/facades/super-admin.facade";
import { SuperAdminController } from "./interface/controllers/super-admin.controller";
import { UpdatePlanUseCase } from "./application/use-cases/UpdatePlan.use-case";

import { ContactModule } from "../contact/contact.module";
import { OrganizationModule } from "../organization/organization.module";
import { SubscriptionModule } from "../subscription/subscription.module";
import { PaymentModule } from "../payment/payment.module";
import { PricingTierRepository } from "../subscription/infrastructure/repositories/pricing-tier.repository";
import { IPricingTierRepository } from "../subscription/domain/repositories/pricing-tier.repository";
import { LoggerService, ILoggerService } from "src/core";
import { STRIPE_SYNC_SERVICE } from "../payment/domain/services/stripe-sync.service";
import {
  SUBSCRIPTION_PLAN_REPOSITORY,
  type ISubscriptionPlanRepository,
} from "../subscription/domain/repositories/subscription-plan.repository";
import { SubscriptionPlanRepository } from "../subscription/infrastructure/repositories/subscription-plan.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrganizationModel,
      UserModel,
      MembershipModel,
      SubscriptionPlanModel,
      UserSubscriptionModel,
      PlanFeatureModel,
      PricingTierModel,
      ClassModel,
    ]),
    forwardRef(() => ContactModule),
    forwardRef(() => OrganizationModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => PaymentModule),
  ],
  controllers: [SuperAdminController],
  providers: [
    SuperAdminFacade,
    LoggerService,
    SubscriptionPlanRepository,
    PricingTierRepository,
    {
      provide: SUBSCRIPTION_PLAN_REPOSITORY,
      useClass: SubscriptionPlanRepository,
    },
    {
      provide: "IPricingTierRepository",
      useExisting: PricingTierRepository,
    },
    {
      provide: "ILoggerService",
      useExisting: LoggerService,
    },
    {
      provide: UpdatePlanUseCase,
      useFactory: (
        planRepository: ISubscriptionPlanRepository,
        pricingTierRepository: IPricingTierRepository,
        stripeSyncService: any,
        logger: ILoggerService
      ) => {
        return new UpdatePlanUseCase(
          planRepository,
          pricingTierRepository,
          stripeSyncService,
          logger
        );
      },
      inject: [
        SUBSCRIPTION_PLAN_REPOSITORY,
        "IPricingTierRepository",
        STRIPE_SYNC_SERVICE,
        "ILoggerService",
      ],
    },
  ],
  exports: [SuperAdminFacade],
})
export class SuperAdminModule {}

