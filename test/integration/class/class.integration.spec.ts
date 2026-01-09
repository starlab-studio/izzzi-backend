import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { TypeOrmModule, getDataSourceToken } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { ClassModule } from "src/modules/class/class.module";
import { OrganizationModule } from "src/modules/organization/organization.module";
import { SubscriptionModule } from "src/modules/subscription/subscription.module";
import { CoreModule } from "src/core/core.module";
import { ClassFacade } from "src/modules/class/application/facades/class.facade";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { IClassRepository } from "src/modules/class/domain/repositories/class.repository";
import { IClassStudentRepository } from "src/modules/class/domain/repositories/class-student.repository";
import { ClassRepository } from "src/modules/class/infrastructure/repositories/class.repository";
import { ClassStudentRepository } from "src/modules/class/infrastructure/repositories/class-student.repository";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { IPricingTierRepository } from "src/modules/subscription/domain/repositories/pricing-tier.repository";
import { SUBSCRIPTION_REPOSITORY } from "src/modules/subscription/domain/repositories/subscription.repository";
import { SUBSCRIPTION_PLAN_REPOSITORY } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { SubscriptionPlanEntity } from "src/modules/subscription/domain/entities/subscription-plan.entity";
import { PricingTierEntity } from "src/modules/subscription/domain/entities/pricing-tier.entity";
import { PricingTierRepository } from "src/modules/subscription/infrastructure/repositories/pricing-tier.repository";
import { UserRole, TypeOrmUnitOfWork, ErrorCode, DomainError } from "src/core";
import { EmailProvider } from "src/modules/notification/infrastructure/providers/email.provider";
import { STRIPE_SYNC_SERVICE } from "src/modules/payment/domain/services/stripe-sync.service";
import { StripeSyncService } from "src/modules/payment/infrastructure/services/stripe-sync.service";
import { CognitoAdapter } from "src/modules/auth/infrastructure/factories/cognito.adapter";
import { CreateSubscriptionUseCase } from "src/modules/subscription/application/use-cases/CreateSubscription.use-case";
import { randomUUID } from "crypto";
import { createMockEmailProvider, createMockStripeSyncService, createMockCognitoAdapter } from "../test-helpers";
import { waitForDatabase } from "../db-helper";

describe("Class Integration", () => {
  let app: INestApplication;
  let classFacade: ClassFacade;
  let organizationFacade: OrganizationFacade;
  let classRepository: IClassRepository;
  let classStudentRepository: IClassStudentRepository;
  let subscriptionRepository: ISubscriptionRepository;
  let subscriptionPlanRepository: ISubscriptionPlanRepository;
  let pricingTierRepository: IPricingTierRepository;

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
        ClassModule,
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

    classFacade = moduleFixture.get<ClassFacade>(ClassFacade);
    organizationFacade = moduleFixture.get<OrganizationFacade>(OrganizationFacade);
    classRepository = moduleFixture.get<IClassRepository>(ClassRepository);
    classStudentRepository = moduleFixture.get<IClassStudentRepository>(ClassStudentRepository);
    subscriptionRepository = moduleFixture.get<ISubscriptionRepository>(SUBSCRIPTION_REPOSITORY);
    subscriptionPlanRepository = moduleFixture.get<ISubscriptionPlanRepository>(SUBSCRIPTION_PLAN_REPOSITORY);
    pricingTierRepository = moduleFixture.get<IPricingTierRepository>(PricingTierRepository);
  });

  afterAll(async () => {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  it("should create class with students", async () => {
    const userData = {
      firstName: "Class",
      lastName: "Owner",
      email: "class.owner@test.com",
      authIdentityId: "auth-class-123",
      organization: "Class Org",
    };
    const savedUser = await organizationFacade.createUserAndOrganization(userData);
    const userProfile = await organizationFacade.getUserProfile(savedUser.id);
    const orgId = userProfile.memberships[0]?.organizationId;
    if (!orgId) {
      throw new Error("Organization not found");
    }

    const plan = SubscriptionPlanEntity.create({
      name: "Test Plan",
      displayPrice: "10€",
      priceSubtext: null,
      basePriceCents: 1000,
      trialPeriodDays: 0,
      isFree: false,
      variant: "default" as const,
      displayOrder: 1,
      stripeProductId: "prod_test",
    });
    await subscriptionPlanRepository.save(plan);

    const tier = PricingTierEntity.create({
      planId: plan.id,
      billingPeriod: "monthly",
      minClasses: 1,
      maxClasses: 10,
      pricePerClassCents: 1000,
      stripePriceId: "price_test",
    });
    await pricingTierRepository.save(tier);

    const stripeSyncService = app.get(STRIPE_SYNC_SERVICE);
    jest.spyOn(stripeSyncService, "getOrCreateCustomer").mockResolvedValue("cus_test");
    jest.spyOn(stripeSyncService, "createSubscription").mockResolvedValue({
      subscriptionId: "sub_test",
      clientSecret: null,
      status: "active",
    });

    const createSubscriptionUseCase = app.get(CreateSubscriptionUseCase);
    const result = await createSubscriptionUseCase.execute({
      userId: savedUser.id,
      organizationId: orgId,
      planId: plan.id,
      quantity: 5,
      billingPeriod: "monthly",
    });

    if (result.subscription) {
      const subscription = await subscriptionRepository.findById(result.subscription.id);
      if (subscription && subscription.status === "pending") {
        subscription.activate();
        await subscriptionRepository.save(subscription);
      }
    }

    const classData = {
      name: "Test Class",
      description: "Test Description",
      numberOfStudents: 3,
      studentEmails: "student1@test.com; student2@test.com; student3@test.com",
      organizationId: orgId,
      userId: savedUser.id,
    };

    const createdClass = await classFacade.createClass(classData, savedUser.email);

    expect(createdClass.name).toBe(classData.name);
    expect(createdClass.description).toBe(classData.description);
    expect(createdClass.numberOfStudents).toBe(classData.numberOfStudents);
    expect(createdClass.organizationId).toBe(orgId);
    expect(createdClass.userId).toBe(savedUser.id);
    expect(createdClass.status).toBe("active");
    expect(createdClass.code).toBeDefined();
    expect(createdClass.accessToken).toBeDefined();

    const students = await classStudentRepository.findByClass(createdClass.id);
    expect(students.length).toBe(3);
    expect(students.every(s => s.isActive)).toBe(true);
  });

  it("should reject creating class with duplicate name", async () => {
    const userData = {
      firstName: "Duplicate",
      lastName: "Owner",
      email: "duplicate.owner@test.com",
      authIdentityId: "auth-dup-class-123",
      organization: "Duplicate Class Org",
    };
    const savedUser = await organizationFacade.createUserAndOrganization(userData);
    const userProfile = await organizationFacade.getUserProfile(savedUser.id);
    const orgId = userProfile.memberships[0]?.organizationId;
    if (!orgId) {
      throw new Error("Organization not found");
    }

    const plan = SubscriptionPlanEntity.create({
      name: "Dup Plan",
      displayPrice: "10€",
      priceSubtext: null,
      basePriceCents: 1000,
      trialPeriodDays: 0,
      isFree: false,
      variant: "default" as const,
      displayOrder: 1,
      stripeProductId: "prod_dup",
    });
    await subscriptionPlanRepository.save(plan);

    const tier = PricingTierEntity.create({
      planId: plan.id,
      billingPeriod: "monthly",
      minClasses: 1,
      maxClasses: 10,
      pricePerClassCents: 1000,
      stripePriceId: "price_dup",
    });
    await pricingTierRepository.save(tier);

    const stripeSyncService = app.get(STRIPE_SYNC_SERVICE);
    jest.spyOn(stripeSyncService, "getOrCreateCustomer").mockResolvedValue("cus_dup");
    jest.spyOn(stripeSyncService, "createSubscription").mockResolvedValue({
      subscriptionId: "sub_dup",
      clientSecret: null,
      status: "active",
    });

    const createSubscriptionUseCase = app.get(CreateSubscriptionUseCase);
    const result = await createSubscriptionUseCase.execute({
      userId: savedUser.id,
      organizationId: orgId,
      planId: plan.id,
      quantity: 5,
      billingPeriod: "monthly",
    });

    if (result.subscription) {
      const subscription = await subscriptionRepository.findById(result.subscription.id);
      if (subscription && subscription.status === "pending") {
        subscription.activate();
        await subscriptionRepository.save(subscription);
      }
    }

    const classData = {
      name: "Duplicate Name Class",
      description: null,
      numberOfStudents: 2,
      studentEmails: "s1@test.com; s2@test.com",
      organizationId: orgId,
      userId: savedUser.id,
    };

    await classFacade.createClass(classData, savedUser.email);

    try {
      await classFacade.createClass(classData, savedUser.email);
      fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).errors[0]?.code).toBe(ErrorCode.CLASS_ALREADY_EXISTS);
    }
  });

  it("should update class and manage students", async () => {
    const userData = {
      firstName: "Update",
      lastName: "Owner",
      email: "update.owner@test.com",
      authIdentityId: "auth-update-class-123",
      organization: "Update Class Org",
    };
    const savedUser = await organizationFacade.createUserAndOrganization(userData);
    const userProfile = await organizationFacade.getUserProfile(savedUser.id);
    const orgId = userProfile.memberships[0]?.organizationId;
    if (!orgId) {
      throw new Error("Organization not found");
    }

    const plan = SubscriptionPlanEntity.create({
      name: "Update Plan",
      displayPrice: "10€",
      priceSubtext: null,
      basePriceCents: 1000,
      trialPeriodDays: 0,
      isFree: false,
      variant: "default" as const,
      displayOrder: 1,
      stripeProductId: "prod_update",
    });
    await subscriptionPlanRepository.save(plan);

    const tier = PricingTierEntity.create({
      planId: plan.id,
      billingPeriod: "monthly",
      minClasses: 1,
      maxClasses: 10,
      pricePerClassCents: 1000,
      stripePriceId: "price_update",
    });
    await pricingTierRepository.save(tier);

    const stripeSyncService = app.get(STRIPE_SYNC_SERVICE);
    jest.spyOn(stripeSyncService, "getOrCreateCustomer").mockResolvedValue("cus_update");
    jest.spyOn(stripeSyncService, "createSubscription").mockResolvedValue({
      subscriptionId: "sub_update",
      clientSecret: null,
      status: "active",
    });

    const createSubscriptionUseCase = app.get(CreateSubscriptionUseCase);
    const result = await createSubscriptionUseCase.execute({
      userId: savedUser.id,
      organizationId: orgId,
      planId: plan.id,
      quantity: 5,
      billingPeriod: "monthly",
    });

    if (result.subscription) {
      const subscription = await subscriptionRepository.findById(result.subscription.id);
      if (subscription && subscription.status === "pending") {
        subscription.activate();
        await subscriptionRepository.save(subscription);
      }
    }

    const classData = {
      name: "Update Test Class",
      description: "Original",
      numberOfStudents: 2,
      studentEmails: "u1@test.com; u2@test.com",
      organizationId: orgId,
      userId: savedUser.id,
    };

    const createdClass = await classFacade.createClass(classData, savedUser.email);

    const updatedClass = await classFacade.updateClass(
      createdClass.id,
      orgId,
      savedUser.id,
      {
        name: "Updated Class Name",
        description: "Updated Description",
        numberOfStudents: 4,
        studentEmails: "u1@test.com; u2@test.com; u3@test.com; u4@test.com",
      }
    );

    expect(updatedClass.name).toBe("Updated Class Name");
    expect(updatedClass.description).toBe("Updated Description");
    expect(updatedClass.numberOfStudents).toBe(4);

    const students = await classStudentRepository.findByClass(createdClass.id);
    const activeStudents = students.filter(s => s.isActive);
    expect(activeStudents.length).toBe(4);
  });

  it("should archive class", async () => {
    const userData = {
      firstName: "Archive",
      lastName: "Owner",
      email: "archive.owner@test.com",
      authIdentityId: "auth-archive-class-123",
      organization: "Archive Class Org",
    };
    const savedUser = await organizationFacade.createUserAndOrganization(userData);
    const userProfile = await organizationFacade.getUserProfile(savedUser.id);
    const orgId = userProfile.memberships[0]?.organizationId;
    if (!orgId) {
      throw new Error("Organization not found");
    }

    const plan = SubscriptionPlanEntity.create({
      name: "Archive Plan",
      displayPrice: "10€",
      priceSubtext: null,
      basePriceCents: 1000,
      trialPeriodDays: 0,
      isFree: false,
      variant: "default" as const,
      displayOrder: 1,
      stripeProductId: "prod_archive",
    });
    await subscriptionPlanRepository.save(plan);

    const tier = PricingTierEntity.create({
      planId: plan.id,
      billingPeriod: "monthly",
      minClasses: 1,
      maxClasses: 10,
      pricePerClassCents: 1000,
      stripePriceId: "price_archive",
    });
    await pricingTierRepository.save(tier);

    const stripeSyncService = app.get(STRIPE_SYNC_SERVICE);
    jest.spyOn(stripeSyncService, "getOrCreateCustomer").mockResolvedValue("cus_archive");
    jest.spyOn(stripeSyncService, "createSubscription").mockResolvedValue({
      subscriptionId: "sub_archive",
      clientSecret: null,
      status: "active",
    });

    const createSubscriptionUseCase = app.get(CreateSubscriptionUseCase);
    const result = await createSubscriptionUseCase.execute({
      userId: savedUser.id,
      organizationId: orgId,
      planId: plan.id,
      quantity: 5,
      billingPeriod: "monthly",
    });

    if (result.subscription) {
      const subscription = await subscriptionRepository.findById(result.subscription.id);
      if (subscription && subscription.status === "pending") {
        subscription.activate();
        await subscriptionRepository.save(subscription);
      }
    }

    const classData = {
      name: "Archive Test Class",
      description: null,
      numberOfStudents: 2,
      studentEmails: "a1@test.com; a2@test.com",
      organizationId: orgId,
      userId: savedUser.id,
    };

    const createdClass = await classFacade.createClass(classData, savedUser.email);

    const archivedClass = await classFacade.archiveClass(
      createdClass.id,
      orgId,
      savedUser.id,
      savedUser.email
    );

    expect(archivedClass.status).toBe("archived");
    expect(archivedClass.archivedAt).toBeDefined();
  });

  it("should reject updating archived class", async () => {
    const userData = {
      firstName: "Reject",
      lastName: "Owner",
      email: "reject.owner@test.com",
      authIdentityId: "auth-reject-class-123",
      organization: "Reject Class Org",
    };
    const savedUser = await organizationFacade.createUserAndOrganization(userData);
    const userProfile = await organizationFacade.getUserProfile(savedUser.id);
    const orgId = userProfile.memberships[0]?.organizationId;
    if (!orgId) {
      throw new Error("Organization not found");
    }

    const plan = SubscriptionPlanEntity.create({
      name: "Reject Plan",
      displayPrice: "10€",
      priceSubtext: null,
      basePriceCents: 1000,
      trialPeriodDays: 0,
      isFree: false,
      variant: "default" as const,
      displayOrder: 1,
      stripeProductId: "prod_reject",
    });
    await subscriptionPlanRepository.save(plan);

    const tier = PricingTierEntity.create({
      planId: plan.id,
      billingPeriod: "monthly",
      minClasses: 1,
      maxClasses: 10,
      pricePerClassCents: 1000,
      stripePriceId: "price_reject",
    });
    await pricingTierRepository.save(tier);

    const stripeSyncService = app.get(STRIPE_SYNC_SERVICE);
    jest.spyOn(stripeSyncService, "getOrCreateCustomer").mockResolvedValue("cus_reject");
    jest.spyOn(stripeSyncService, "createSubscription").mockResolvedValue({
      subscriptionId: "sub_reject",
      clientSecret: null,
      status: "active",
    });

    const createSubscriptionUseCase = app.get(CreateSubscriptionUseCase);
    const result = await createSubscriptionUseCase.execute({
      userId: savedUser.id,
      organizationId: orgId,
      planId: plan.id,
      quantity: 5,
      billingPeriod: "monthly",
    });

    if (result.subscription) {
      const subscription = await subscriptionRepository.findById(result.subscription.id);
      if (subscription && subscription.status === "pending") {
        subscription.activate();
        await subscriptionRepository.save(subscription);
      }
    }

    const classData = {
      name: "Reject Test Class",
      description: null,
      numberOfStudents: 2,
      studentEmails: "r1@test.com; r2@test.com",
      organizationId: orgId,
      userId: savedUser.id,
    };

    const createdClass = await classFacade.createClass(classData, savedUser.email);
    await classFacade.archiveClass(createdClass.id, orgId, savedUser.id, savedUser.email);

    try {
      await classFacade.updateClass(createdClass.id, orgId, savedUser.id, {
        name: "Updated Name",
      });
      fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).errors[0]?.code).toBe(ErrorCode.CLASS_ALREADY_ARCHIVED);
    }
  });

  it("should get classes by organization", async () => {
    const userData = {
      firstName: "Get",
      lastName: "Owner",
      email: "get.owner@test.com",
      authIdentityId: "auth-get-class-123",
      organization: "Get Class Org",
    };
    const savedUser = await organizationFacade.createUserAndOrganization(userData);
    const userProfile = await organizationFacade.getUserProfile(savedUser.id);
    const orgId = userProfile.memberships[0]?.organizationId;
    if (!orgId) {
      throw new Error("Organization not found");
    }

    const plan = SubscriptionPlanEntity.create({
      name: "Get Plan",
      displayPrice: "10€",
      priceSubtext: null,
      basePriceCents: 1000,
      trialPeriodDays: 0,
      isFree: false,
      variant: "default" as const,
      displayOrder: 1,
      stripeProductId: "prod_get",
    });
    await subscriptionPlanRepository.save(plan);

    const tier = PricingTierEntity.create({
      planId: plan.id,
      billingPeriod: "monthly",
      minClasses: 1,
      maxClasses: 10,
      pricePerClassCents: 1000,
      stripePriceId: "price_get",
    });
    await pricingTierRepository.save(tier);

    const stripeSyncService = app.get(STRIPE_SYNC_SERVICE);
    jest.spyOn(stripeSyncService, "getOrCreateCustomer").mockResolvedValue("cus_get");
    jest.spyOn(stripeSyncService, "createSubscription").mockResolvedValue({
      subscriptionId: "sub_get",
      clientSecret: null,
      status: "active",
    });

    const createSubscriptionUseCase = app.get(CreateSubscriptionUseCase);
    const result = await createSubscriptionUseCase.execute({
      userId: savedUser.id,
      organizationId: orgId,
      planId: plan.id,
      quantity: 5,
      billingPeriod: "monthly",
    });

    if (result.subscription) {
      const subscription = await subscriptionRepository.findById(result.subscription.id);
      if (subscription && subscription.status === "pending") {
        subscription.activate();
        await subscriptionRepository.save(subscription);
      }
    }

    const classData1 = {
      name: "Get Class 1",
      description: null,
      numberOfStudents: 2,
      studentEmails: "g1@test.com; g2@test.com",
      organizationId: orgId,
      userId: savedUser.id,
    };

    const classData2 = {
      name: "Get Class 2",
      description: null,
      numberOfStudents: 1,
      studentEmails: "g3@test.com",
      organizationId: orgId,
      userId: savedUser.id,
    };

    await classFacade.createClass(classData1, savedUser.email);
    await classFacade.createClass(classData2, savedUser.email);

    const classes = await classFacade.getClassesByOrganization(orgId, savedUser.id);

    expect(classes.length).toBeGreaterThanOrEqual(2);
    const class1 = classes.find(c => c.name === "Get Class 1");
    expect(class1).toBeDefined();
    expect(class1?.status).toBe("active");
    expect(class1?.students.length).toBe(2);
  });

  it("should get class by id", async () => {
    const userData = {
      firstName: "GetById",
      lastName: "Owner",
      email: "getbyid.owner@test.com",
      authIdentityId: "auth-getbyid-class-123",
      organization: "GetById Class Org",
    };
    const savedUser = await organizationFacade.createUserAndOrganization(userData);
    const userProfile = await organizationFacade.getUserProfile(savedUser.id);
    const orgId = userProfile.memberships[0]?.organizationId;
    if (!orgId) {
      throw new Error("Organization not found");
    }

    const plan = SubscriptionPlanEntity.create({
      name: "GetById Plan",
      displayPrice: "10€",
      priceSubtext: null,
      basePriceCents: 1000,
      trialPeriodDays: 0,
      isFree: false,
      variant: "default" as const,
      displayOrder: 1,
      stripeProductId: "prod_getbyid",
    });
    await subscriptionPlanRepository.save(plan);

    const tier = PricingTierEntity.create({
      planId: plan.id,
      billingPeriod: "monthly",
      minClasses: 1,
      maxClasses: 10,
      pricePerClassCents: 1000,
      stripePriceId: "price_getbyid",
    });
    await pricingTierRepository.save(tier);

    const stripeSyncService = app.get(STRIPE_SYNC_SERVICE);
    jest.spyOn(stripeSyncService, "getOrCreateCustomer").mockResolvedValue("cus_getbyid");
    jest.spyOn(stripeSyncService, "createSubscription").mockResolvedValue({
      subscriptionId: "sub_getbyid",
      clientSecret: null,
      status: "active",
    });

    const createSubscriptionUseCase = app.get(CreateSubscriptionUseCase);
    const result = await createSubscriptionUseCase.execute({
      userId: savedUser.id,
      organizationId: orgId,
      planId: plan.id,
      quantity: 5,
      billingPeriod: "monthly",
    });

    if (result.subscription) {
      const subscription = await subscriptionRepository.findById(result.subscription.id);
      if (subscription && subscription.status === "pending") {
        subscription.activate();
        await subscriptionRepository.save(subscription);
      }
    }

    const classData = {
      name: "GetById Test Class",
      description: "Test Description",
      numberOfStudents: 2,
      studentEmails: "gb1@test.com; gb2@test.com",
      organizationId: orgId,
      userId: savedUser.id,
    };

    const createdClass = await classFacade.createClass(classData, savedUser.email);

    const classDetail = await classFacade.getClassById(createdClass.id, orgId, savedUser.id);

    expect(classDetail.id).toBe(createdClass.id);
    expect(classDetail.name).toBe(classData.name);
    expect(classDetail.description).toBe(classData.description);
    expect(classDetail.student_count).toBe(2);
    expect(classDetail.students.length).toBe(2);
  });

  it("should reject getting non-existent class", async () => {
    const userData = {
      firstName: "NotFound",
      lastName: "Owner",
      email: "notfound.owner@test.com",
      authIdentityId: "auth-notfound-class-123",
      organization: "NotFound Class Org",
    };
    const savedUser = await organizationFacade.createUserAndOrganization(userData);
    const userProfile = await organizationFacade.getUserProfile(savedUser.id);
    const orgId = userProfile.memberships[0]?.organizationId;
    if (!orgId) {
      throw new Error("Organization not found");
    }

    await expect(
      classFacade.getClassById(randomUUID(), orgId, savedUser.id)
    ).rejects.toThrow(DomainError);
  });
});

