import { Module, forwardRef } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  LoggerService,
  ILoggerService,
  IEventStore,
  EventStore,
} from "src/core";
import { CoreModule } from "src/core/core.module";
import { OrganizationModule } from "../organization";
import { IUserRepository } from "../organization/domain/repositories/user.repository";
import { UserRepository } from "../organization/infrastructure/repositories/user.repository";

import { SubscriptionPlanModel } from "./infrastructure/models/subscription-plan.model";
import { PlanFeatureModel } from "./infrastructure/models/plan-feature.model";
import { PricingTierModel } from "./infrastructure/models/pricing-tier.model";
import { UserSubscriptionModel } from "./infrastructure/models/user-subscription.model";
import { InvoiceModel } from "./infrastructure/models/invoice.model";

import { SubscriptionPlanRepository } from "./infrastructure/repositories/subscription-plan.repository";
import { PlanFeatureRepository } from "./infrastructure/repositories/plan-feature.repository";
import { PricingTierRepository } from "./infrastructure/repositories/pricing-tier.repository";
import { SubscriptionRepository } from "./infrastructure/repositories/subscription.repository";
import { InvoiceRepository } from "./infrastructure/repositories/invoice.repository";

import {
  ISubscriptionPlanRepository,
  SUBSCRIPTION_PLAN_REPOSITORY,
} from "./domain/repositories/subscription-plan.repository";
import { IPlanFeatureRepository } from "./domain/repositories/plan-feature.repository";
import { IPricingTierRepository } from "./domain/repositories/pricing-tier.repository";
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from "./domain/repositories/subscription.repository";
import {
  IInvoiceRepository,
  INVOICE_REPOSITORY,
} from "./domain/repositories/invoice.repository";

import { GetPricingPlansUseCase } from "./application/use-cases/GetPricingPlans.use-case";
import { GetPricingTiersUseCase } from "./application/use-cases/GetPricingTiers.use-case";
import { CalculateSubscriptionPriceUseCase } from "./application/use-cases/CalculateSubscriptionPrice.use-case";
import { CreateSubscriptionUseCase } from "./application/use-cases/CreateSubscription.use-case";
import { UpdateSubscriptionQuantityUseCase } from "./application/use-cases/UpdateSubscriptionQuantity.use-case";
import { CancelSubscriptionUseCase } from "./application/use-cases/CancelSubscription.use-case";
import { GetSubscriptionUseCase } from "./application/use-cases/GetSubscription.use-case";
import { SyncPlansWithStripeUseCase } from "./application/use-cases/SyncPlansWithStripe.use-case";
import { GetPaymentConfirmationUseCase } from "./application/use-cases/GetPaymentConfirmation.use-case";
import { SyncInvoiceFromStripeUseCase } from "./application/use-cases/SyncInvoiceFromStripe.use-case";
import { SyncSubscriptionFromStripeUseCase } from "./application/use-cases/SyncSubscriptionFromStripe.use-case";
import { ApplyPendingQuantityUseCase } from "./application/use-cases/ApplyPendingQuantity.use-case";

import { SubscriptionFacade } from "./application/facades/subscription.facade";

import { SubscriptionController } from "./interface/controllers/subscription.controller";
import { PaymentModule } from "../payment/payment.module";
import {
  IPaymentService,
  PAYMENT_SERVICE,
} from "./domain/services/payment.service";
import { StripePaymentService } from "./infrastructure/services/stripe-payment.service";
import {
  IStripeSyncService,
  STRIPE_SYNC_SERVICE,
} from "../payment/domain/services/stripe-sync.service";
import { NotificationModule } from "../notification/notification.module";
import { CreateEmailNotificationUseCase } from "../notification/application/use-cases/create-email-notification.use-case";
import { GetBillingPortalLinkUseCase } from "./application/use-cases/GetBillingPortalLink.use-case";
import { CheckBillingAccessUseCase } from "./application/use-cases/CheckBillingAccess.use-case";
import { SendSubscriptionConfirmationEmailUseCase } from "./application/use-cases/SendSubscriptionConfirmationEmail.use-case";
import { OrganizationAuthorizationService } from "../organization/domain/services/organization-authorization.service";
import { TrialEndingCheckerService } from "./infrastructure/scheduled/trial-ending-checker.service";
import { SubscriptionExpirationCheckerService } from "./infrastructure/scheduled/subscription-expiration-checker.service";
import { StripePlansSyncService } from "./infrastructure/scheduled/stripe-plans-sync.service";
import { IMembershipRepository } from "../organization/domain/repositories/membership.repository";
import { ClassModule } from "../class/class.module";
import { IClassRepository } from "../class/domain/repositories/class.repository";
import { SubscriptionFeatureService } from "./domain/services/subscription-feature.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlanModel,
      PlanFeatureModel,
      PricingTierModel,
      UserSubscriptionModel,
      InvoiceModel,
    ]),
    forwardRef(() => CoreModule),
    ScheduleModule.forRoot(),
    forwardRef(() => OrganizationModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => ClassModule),
  ],
  controllers: [SubscriptionController],
  providers: [
    LoggerService,
    SubscriptionPlanRepository,
    PlanFeatureRepository,
    PricingTierRepository,
    SubscriptionRepository,
    InvoiceRepository,
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useClass: SubscriptionRepository,
    },
    {
      provide: INVOICE_REPOSITORY,
      useClass: InvoiceRepository,
    },
    {
      provide: SUBSCRIPTION_PLAN_REPOSITORY,
      useClass: SubscriptionPlanRepository,
    },
    {
      provide: PAYMENT_SERVICE,
      useFactory: (stripeSyncService: IStripeSyncService) =>
        new StripePaymentService(stripeSyncService),
      inject: [STRIPE_SYNC_SERVICE],
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
        userRepository: IUserRepository,
        paymentService: IPaymentService,
        stripeSyncService: IStripeSyncService
      ) =>
        new CreateSubscriptionUseCase(
          logger,
          subscriptionPlanRepository,
          pricingTierRepository,
          subscriptionRepository,
          userRepository,
          paymentService,
          stripeSyncService
        ),
      inject: [
        LoggerService,
        SubscriptionPlanRepository,
        PricingTierRepository,
        SubscriptionRepository,
        UserRepository,
        PAYMENT_SERVICE,
        STRIPE_SYNC_SERVICE,
      ],
    },
    {
      provide: UpdateSubscriptionQuantityUseCase,
      useFactory: (
        logger: ILoggerService,
        subscriptionRepository: ISubscriptionRepository,
        subscriptionPlanRepository: ISubscriptionPlanRepository,
        pricingTierRepository: IPricingTierRepository,
        userRepository: IUserRepository,
        stripeSyncService: IStripeSyncService,
        eventStore: IEventStore,
        classRepository: IClassRepository
      ) =>
        new UpdateSubscriptionQuantityUseCase(
          logger,
          subscriptionRepository,
          subscriptionPlanRepository,
          pricingTierRepository,
          userRepository,
          stripeSyncService,
          eventStore,
          classRepository
        ),
      inject: [
        LoggerService,
        SubscriptionRepository,
        SubscriptionPlanRepository,
        PricingTierRepository,
        UserRepository,
        STRIPE_SYNC_SERVICE,
        EventStore,
        "CLASS_REPOSITORY",
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
        userRepository: IUserRepository,
        classRepository: IClassRepository
      ) =>
        new GetSubscriptionUseCase(
          logger,
          subscriptionRepository,
          subscriptionPlanRepository,
          pricingTierRepository,
          planFeatureRepository,
          userRepository,
          classRepository
        ),
      inject: [
        LoggerService,
        SubscriptionRepository,
        SubscriptionPlanRepository,
        PricingTierRepository,
        PlanFeatureRepository,
        UserRepository,
        "CLASS_REPOSITORY",
      ],
    },
    {
      provide: SyncPlansWithStripeUseCase,
      useFactory: (
        logger: ILoggerService,
        subscriptionPlanRepository: ISubscriptionPlanRepository,
        pricingTierRepository: IPricingTierRepository,
        stripeSyncService: IStripeSyncService
      ) =>
        new SyncPlansWithStripeUseCase(
          logger,
          subscriptionPlanRepository,
          pricingTierRepository,
          stripeSyncService
        ),
      inject: [
        LoggerService,
        SubscriptionPlanRepository,
        PricingTierRepository,
        STRIPE_SYNC_SERVICE,
      ],
    },
    {
      provide: GetPaymentConfirmationUseCase,
      useFactory: (
        logger: ILoggerService,
        subscriptionRepository: ISubscriptionRepository,
        invoiceRepository: IInvoiceRepository,
        stripeSyncService: IStripeSyncService,
        organizationAuthorizationService: OrganizationAuthorizationService
      ) =>
        new GetPaymentConfirmationUseCase(
          logger,
          subscriptionRepository,
          invoiceRepository,
          stripeSyncService,
          organizationAuthorizationService
        ),
      inject: [
        LoggerService,
        SubscriptionRepository,
        InvoiceRepository,
        STRIPE_SYNC_SERVICE,
        OrganizationAuthorizationService,
      ],
    },
    {
      provide: SyncInvoiceFromStripeUseCase,
      useFactory: (
        logger: ILoggerService,
        invoiceRepository: IInvoiceRepository,
        subscriptionRepository: ISubscriptionRepository,
        subscriptionPlanRepository: ISubscriptionPlanRepository,
        stripeSyncService: IStripeSyncService,
        eventStore: IEventStore
      ) =>
        new SyncInvoiceFromStripeUseCase(
          logger,
          invoiceRepository,
          subscriptionRepository,
          subscriptionPlanRepository,
          stripeSyncService,
          eventStore
        ),
      inject: [
        LoggerService,
        InvoiceRepository,
        SubscriptionRepository,
        SubscriptionPlanRepository,
        STRIPE_SYNC_SERVICE,
        EventStore,
      ],
    },
    {
      provide: SyncSubscriptionFromStripeUseCase,
      useFactory: (
        logger: ILoggerService,
        subscriptionRepository: ISubscriptionRepository
      ) =>
        new SyncSubscriptionFromStripeUseCase(logger, subscriptionRepository),
      inject: [LoggerService, SubscriptionRepository],
    },
    {
      provide: ApplyPendingQuantityUseCase,
      useFactory: (
        logger: ILoggerService,
        subscriptionRepository: ISubscriptionRepository
      ) => new ApplyPendingQuantityUseCase(logger, subscriptionRepository),
      inject: [LoggerService, SubscriptionRepository],
    },
    {
      provide: GetBillingPortalLinkUseCase,
      useFactory: (
        logger: ILoggerService,
        subscriptionRepository: ISubscriptionRepository,
        stripeSyncService: IStripeSyncService,
        organizationAuthorizationService: OrganizationAuthorizationService
      ) =>
        new GetBillingPortalLinkUseCase(
          logger,
          subscriptionRepository,
          stripeSyncService,
          organizationAuthorizationService
        ),
      inject: [
        LoggerService,
        SubscriptionRepository,
        STRIPE_SYNC_SERVICE,
        OrganizationAuthorizationService,
      ],
    },
    {
      provide: CheckBillingAccessUseCase,
      useFactory: (
        logger: ILoggerService,
        subscriptionRepository: ISubscriptionRepository
      ) => new CheckBillingAccessUseCase(logger, subscriptionRepository),
      inject: [LoggerService, SubscriptionRepository],
    },
    {
      provide: SendSubscriptionConfirmationEmailUseCase,
      useFactory: (
        logger: ILoggerService,
        subscriptionRepository: ISubscriptionRepository,
        userRepository: IUserRepository,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase,
        getBillingPortalLinkUseCase: GetBillingPortalLinkUseCase
      ) =>
        new SendSubscriptionConfirmationEmailUseCase(
          logger,
          subscriptionRepository,
          userRepository,
          createEmailNotificationUseCase,
          getBillingPortalLinkUseCase
        ),
      inject: [
        LoggerService,
        SubscriptionRepository,
        UserRepository,
        CreateEmailNotificationUseCase,
        GetBillingPortalLinkUseCase,
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
        getSubscriptionUseCase: GetSubscriptionUseCase,
        syncPlansWithStripeUseCase: SyncPlansWithStripeUseCase,
        getPaymentConfirmationUseCase: GetPaymentConfirmationUseCase,
        getBillingPortalLinkUseCase: GetBillingPortalLinkUseCase,
        checkBillingAccessUseCase: CheckBillingAccessUseCase
      ) =>
        new SubscriptionFacade(
          getPricingPlansUseCase,
          getPricingTiersUseCase,
          calculateSubscriptionPriceUseCase,
          createSubscriptionUseCase,
          updateSubscriptionQuantityUseCase,
          cancelSubscriptionUseCase,
          getSubscriptionUseCase,
          syncPlansWithStripeUseCase,
          getPaymentConfirmationUseCase,
          getBillingPortalLinkUseCase,
          checkBillingAccessUseCase
        ),
      inject: [
        GetPricingPlansUseCase,
        GetPricingTiersUseCase,
        CalculateSubscriptionPriceUseCase,
        CreateSubscriptionUseCase,
        UpdateSubscriptionQuantityUseCase,
        CancelSubscriptionUseCase,
        GetSubscriptionUseCase,
        SyncPlansWithStripeUseCase,
        GetPaymentConfirmationUseCase,
        GetBillingPortalLinkUseCase,
        CheckBillingAccessUseCase,
      ],
    },
    {
      provide: TrialEndingCheckerService,
      useFactory: (
        logger: ILoggerService,
        subscriptionRepository: ISubscriptionRepository,
        subscriptionPlanRepository: ISubscriptionPlanRepository,
        membershipRepository: IMembershipRepository,
        userRepository: IUserRepository,
        eventStore: IEventStore
      ) =>
        new TrialEndingCheckerService(
          logger,
          subscriptionRepository,
          subscriptionPlanRepository,
          membershipRepository,
          userRepository,
          eventStore
        ),
      inject: [
        LoggerService,
        SUBSCRIPTION_REPOSITORY,
        SUBSCRIPTION_PLAN_REPOSITORY,
        "MEMBERSHIP_REPOSITORY",
        "USER_REPOSITORY",
        EventStore,
      ],
    },
    {
      provide: SubscriptionExpirationCheckerService,
      useFactory: (
        logger: ILoggerService,
        subscriptionRepository: ISubscriptionRepository,
        stripeSyncService: IStripeSyncService,
        syncSubscriptionFromStripeUseCase: SyncSubscriptionFromStripeUseCase
      ) =>
        new SubscriptionExpirationCheckerService(
          logger,
          subscriptionRepository,
          stripeSyncService,
          syncSubscriptionFromStripeUseCase
        ),
      inject: [
        LoggerService,
        SUBSCRIPTION_REPOSITORY,
        STRIPE_SYNC_SERVICE,
        SyncSubscriptionFromStripeUseCase,
      ],
    },
    {
      provide: StripePlansSyncService,
      useFactory: (
        logger: ILoggerService,
        syncPlansWithStripeUseCase: SyncPlansWithStripeUseCase
      ) => new StripePlansSyncService(logger, syncPlansWithStripeUseCase),
      inject: [LoggerService, SyncPlansWithStripeUseCase],
    },
    {
      provide: SubscriptionFeatureService,
      useFactory: (
        subscriptionRepository: ISubscriptionRepository,
        subscriptionPlanRepository: ISubscriptionPlanRepository
      ) =>
        new SubscriptionFeatureService(
          subscriptionRepository,
          subscriptionPlanRepository
        ),
      inject: [SUBSCRIPTION_REPOSITORY, SUBSCRIPTION_PLAN_REPOSITORY],
    },
  ],
  exports: [
    SubscriptionFacade,
    InvoiceRepository,
    SubscriptionRepository,
    SubscriptionPlanRepository,
    PricingTierRepository,
    INVOICE_REPOSITORY,
    SUBSCRIPTION_REPOSITORY,
    SUBSCRIPTION_PLAN_REPOSITORY,
    GetPaymentConfirmationUseCase,
    SyncInvoiceFromStripeUseCase,
    SyncSubscriptionFromStripeUseCase,
    ApplyPendingQuantityUseCase,
    GetBillingPortalLinkUseCase,
    SendSubscriptionConfirmationEmailUseCase,
    SubscriptionFeatureService,
  ],
})
export class SubscriptionModule {}
