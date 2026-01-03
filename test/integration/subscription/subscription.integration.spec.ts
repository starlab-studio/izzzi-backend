import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { TypeOrmModule, getDataSourceToken } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { SubscriptionModule } from "src/modules/subscription/subscription.module";
import { OrganizationModule } from "src/modules/organization/organization.module";
import { CoreModule } from "src/core/core.module";
import { CreateSubscriptionUseCase } from "src/modules/subscription/application/use-cases/CreateSubscription.use-case";
import { UpdateSubscriptionQuantityUseCase } from "src/modules/subscription/application/use-cases/UpdateSubscriptionQuantity.use-case";
import { IStripeSyncService } from "src/modules/payment/domain/services/stripe-sync.service";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { IOrganizationRepository } from "src/modules/organization/domain/repositories/organization.repository";
import { UserEntity } from "src/modules/organization/domain/entities/user.entity";
import { OrganizationEntity } from "src/modules/organization/domain/entities/organization.entity";
import { MembershipEntity } from "src/modules/organization/domain/entities/membership.entity";
import { UserRole, TypeOrmUnitOfWork } from "src/core";
import { EmailProvider } from "src/modules/notification/infrastructure/providers/email.provider";
import { STRIPE_SYNC_SERVICE } from "src/modules/payment/domain/services/stripe-sync.service";
import { StripeSyncService } from "src/modules/payment/infrastructure/services/stripe-sync.service";
import { CognitoAdapter } from "src/modules/auth/infrastructure/factories/cognito.adapter";
import { OrganizationRepository } from "src/modules/organization/infrastructure/repositories/organization.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { SUBSCRIPTION_REPOSITORY } from "src/modules/subscription/domain/repositories/subscription.repository";
import { SUBSCRIPTION_PLAN_REPOSITORY } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { IPricingTierRepository } from "src/modules/subscription/domain/repositories/pricing-tier.repository";
import { SubscriptionPlanEntity } from "src/modules/subscription/domain/entities/subscription-plan.entity";
import { PricingTierEntity } from "src/modules/subscription/domain/entities/pricing-tier.entity";
import { PricingTierRepository } from "src/modules/subscription/infrastructure/repositories/pricing-tier.repository";
import { randomUUID } from "crypto";
import { createMockEmailProvider, createMockStripeSyncService, createMockCognitoAdapter } from "../test-helpers";
import { waitForDatabase } from "../db-helper";

describe("Subscription Integration", () => {
  let app: INestApplication;
  let createSubscriptionUseCase: CreateSubscriptionUseCase;
  let updateQuantityUseCase: UpdateSubscriptionQuantityUseCase;
  let subscriptionRepository: ISubscriptionRepository;
  let subscriptionPlanRepository: ISubscriptionPlanRepository;
  let pricingTierRepository: IPricingTierRepository;
  let organizationFacade: OrganizationFacade;
  let stripeSyncService: IStripeSyncService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: () => ({
            type: "postgres",
            host: process.env.DATABASE_HOST || "localhost",
            port: parseInt(process.env.DATABASE_PORT || "5432"),
            database: process.env.DATABASE_NAME || "test_db",
            username: process.env.DATABASE_USERNAME || "postgres",
            password: process.env.DATABASE_PASSWORD || "postgres",
            synchronize: true,
            autoLoadEntities: true,
            dropSchema: true,
            extra: {
              max: 10,
              connectionTimeoutMillis: 10000,
              idleTimeoutMillis: 30000,
            },
            retryAttempts: 5,
            retryDelay: 3000,
          }),
        }),
        CoreModule,
        OrganizationModule,
        SubscriptionModule,
      ],
    })
      .overrideProvider(EmailProvider)
      .useValue(createMockEmailProvider())
      .overrideProvider(StripeSyncService)
      .useValue(createMockStripeSyncService())
      .overrideProvider(STRIPE_SYNC_SERVICE)
      .useValue(createMockStripeSyncService())
      .overrideProvider(CognitoAdapter)
      .useValue(createMockCognitoAdapter())
      .overrideProvider(TypeOrmUnitOfWork)
      .useFactory({
        factory: (dataSource: DataSource) => new TypeOrmUnitOfWork(dataSource),
        inject: [getDataSourceToken()],
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const dataSource = app.get(DataSource);
    await waitForDatabase(dataSource);

    createSubscriptionUseCase = moduleFixture.get<CreateSubscriptionUseCase>(CreateSubscriptionUseCase);
    updateQuantityUseCase = moduleFixture.get<UpdateSubscriptionQuantityUseCase>(UpdateSubscriptionQuantityUseCase);
    subscriptionRepository = moduleFixture.get<ISubscriptionRepository>(SUBSCRIPTION_REPOSITORY);
    subscriptionPlanRepository = moduleFixture.get<ISubscriptionPlanRepository>(SUBSCRIPTION_PLAN_REPOSITORY);
    pricingTierRepository = moduleFixture.get<IPricingTierRepository>(PricingTierRepository);
    organizationFacade = moduleFixture.get<OrganizationFacade>(OrganizationFacade);
    stripeSyncService = moduleFixture.get<IStripeSyncService>(STRIPE_SYNC_SERVICE);
  });

  afterAll(async () => {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  it("should create subscription and sync with Stripe", async () => {
    const userData = {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      authIdentityId: "auth-test-123",
      organization: "Test Org",
    };
    const savedUser = await organizationFacade.createUserAndOrganization(userData);
    
    // Get the organization created for this user
    const orgs = await subscriptionRepository.findActiveByOrganizationId(savedUser.id);
    // We need to get the organization from the user's memberships
    const userWithMemberships = await organizationFacade.getUserProfile(savedUser.id);
    const savedOrgId = userWithMemberships.memberships[0]?.organizationId;
    if (!savedOrgId) {
      throw new Error("Organization not found");
    }

    // Create a test subscription plan
    const testPlan = SubscriptionPlanEntity.create({
      name: "Test Plan",
      displayPrice: "10€",
      priceSubtext: null,
      basePriceCents: 1000,
      trialPeriodDays: 0,
      isFree: false,
      variant: "default" as const,
      displayOrder: 1,
      stripeProductId: "prod_test_123",
    });
    await subscriptionPlanRepository.save(testPlan);

    // Create pricing tier for the plan
    const pricingTier = PricingTierEntity.create({
      planId: testPlan.id,
      billingPeriod: "monthly",
      minClasses: 1,
      maxClasses: 20,
      pricePerClassCents: 1000,
      stripePriceId: "price_test_123",
    });
    await pricingTierRepository.save(pricingTier);

    jest.spyOn(stripeSyncService, "getOrCreateCustomer").mockResolvedValue("cus_123");
    jest.spyOn(stripeSyncService, "createSubscription").mockResolvedValue({
      subscriptionId: "sub_123",
      clientSecret: null,
      status: "active",
    });

    const result = await createSubscriptionUseCase.execute({
      userId: savedUser.id,
      organizationId: savedOrgId,
      planId: testPlan.id,
      quantity: 5,
      billingPeriod: "monthly",
    });

    expect(result.subscription).toBeDefined();
    if (result.subscription) {
      expect(result.subscription.planId).toBe(testPlan.id);
      expect(result.subscription.quantity).toBe(5);
      expect(["active", "pending"]).toContain(result.subscription.status);
    }
    expect(stripeSyncService.getOrCreateCustomer).toHaveBeenCalled();
    expect(stripeSyncService.createSubscription).toHaveBeenCalled();

    const savedSubscription = await subscriptionRepository.findActiveByOrganizationId(savedOrgId);
    expect(savedSubscription).toBeDefined();
    if (savedSubscription && result.subscription) {
      expect(savedSubscription.id).toBe(result.subscription.id);
    }
  });

  it("should update quantity and calculate price", async () => {
    const userData = {
      firstName: "Update",
      lastName: "User",
      email: "update@example.com",
      authIdentityId: "auth-update-123",
      organization: "Update Org",
    };
    const savedUser = await organizationFacade.createUserAndOrganization(userData);
    
    const userWithMemberships = await organizationFacade.getUserProfile(savedUser.id);
    const savedOrgId = userWithMemberships.memberships[0]?.organizationId;
    if (!savedOrgId) {
      throw new Error("Organization not found");
    }

    const testPlan = SubscriptionPlanEntity.create({
      name: "Update Plan",
      displayPrice: "20€",
      priceSubtext: null,
      basePriceCents: 2000,
      trialPeriodDays: 0,
      isFree: false,
      variant: "default" as const,
      displayOrder: 1,
      stripeProductId: "prod_update_123",
    });
    await subscriptionPlanRepository.save(testPlan);

    const pricingTier = PricingTierEntity.create({
      planId: testPlan.id,
      billingPeriod: "monthly",
      minClasses: 1,
      maxClasses: 50,
      pricePerClassCents: 2000,
      stripePriceId: "price_update_123",
    });
    await pricingTierRepository.save(pricingTier);

    jest.spyOn(stripeSyncService, "getOrCreateCustomer").mockResolvedValue("cus_update_123");
    jest.spyOn(stripeSyncService, "createSubscription").mockResolvedValue({
      subscriptionId: "sub_update_123",
      clientSecret: null,
      status: "active",
    });
    jest.spyOn(stripeSyncService, "updateSubscriptionQuantity").mockResolvedValue({
      id: "sub_update_123",
      quantity: 10,
    } as any);

    const createResult = await createSubscriptionUseCase.execute({
      userId: savedUser.id,
      organizationId: savedOrgId,
      planId: testPlan.id,
      quantity: 5,
      billingPeriod: "monthly",
    });

    expect(createResult.subscription).toBeDefined();
    if (!createResult.subscription) {
      throw new Error("Subscription not created");
    }

    const subscription = await subscriptionRepository.findById(createResult.subscription.id);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (subscription.status === "pending") {
      subscription.activate();
      await subscriptionRepository.save(subscription);
    }

    const result = await updateQuantityUseCase.execute({
      subscriptionId: subscription.id,
      newQuantity: 10,
      organizationId: savedOrgId,
      userId: savedUser.id,
    });

    expect(result.newQuantity).toBe(10);
    expect(result.isUpgrade).toBe(true);
    expect(stripeSyncService.updateSubscriptionQuantity).toHaveBeenCalled();

    const updatedSubscription = await subscriptionRepository.findById(subscription.id);
    expect(updatedSubscription).toBeDefined();
    if (updatedSubscription) {
      expect(updatedSubscription.quantity).toBe(10);
    }
  });

  it("should reject creating subscription with invalid plan", async () => {
    const userData = {
      firstName: "Invalid",
      lastName: "Plan",
      email: "invalid.plan@example.com",
      authIdentityId: "auth-invalid-plan-123",
      organization: "Invalid Plan Org",
    };
    const savedUser = await organizationFacade.createUserAndOrganization(userData);
    
    const userWithMemberships = await organizationFacade.getUserProfile(savedUser.id);
    const savedOrgId = userWithMemberships.memberships[0]?.organizationId;
    if (!savedOrgId) {
      throw new Error("Organization not found");
    }

    await expect(createSubscriptionUseCase.execute({
      userId: savedUser.id,
      organizationId: savedOrgId,
      planId: randomUUID(),
      quantity: 5,
      billingPeriod: "monthly",
    })).rejects.toThrow();
  });
});

