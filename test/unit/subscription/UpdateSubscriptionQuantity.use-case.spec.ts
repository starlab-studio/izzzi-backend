import { Test, TestingModule } from "@nestjs/testing";
import { UpdateSubscriptionQuantityUseCase } from "src/modules/subscription/application/use-cases/UpdateSubscriptionQuantity.use-case";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { IPricingTierRepository } from "src/modules/subscription/domain/repositories/pricing-tier.repository";
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { IStripeSyncService } from "src/modules/payment/domain/services/stripe-sync.service";
import { IEventStore, ILoggerService, DomainError, UserRole, LoggerService } from "src/core";
import { SubscriptionEntity } from "src/modules/subscription/domain/entities/subscription.entity";
import { SubscriptionPlanEntity } from "src/modules/subscription/domain/entities/subscription-plan.entity";
import { PricingTierEntity } from "src/modules/subscription/domain/entities/pricing-tier.entity";

describe("UpdateSubscriptionQuantityUseCase", () => {
  let useCase: UpdateSubscriptionQuantityUseCase;
  let subscriptionRepository: jest.Mocked<ISubscriptionRepository>;
  let subscriptionPlanRepository: jest.Mocked<ISubscriptionPlanRepository>;
  let pricingTierRepository: jest.Mocked<IPricingTierRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let stripeSyncService: jest.Mocked<IStripeSyncService>;
  let eventStore: jest.Mocked<IEventStore>;
  let classRepository: any;
  let logger: jest.Mocked<ILoggerService>;

  const mockUser = {
    id: "user-id",
    hasRoleInOrganization: jest.fn().mockReturnValue(true),
    belongsToOrganization: jest.fn().mockReturnValue(false),
  } as any;

  const mockSubscription = SubscriptionEntity.create({
    userId: "user-id",
    organizationId: "org-id",
    planId: "plan-id",
    billingPeriod: "monthly",
    quantity: 5,
  });

  const mockPlan = SubscriptionPlanEntity.reconstitute({
    id: "plan-id",
    name: "Test Plan",
    displayPrice: "10€",
    priceSubtext: null,
    basePriceCents: 1000,
    trialPeriodDays: 0,
    isFree: false,
    variant: "default" as const,
    displayOrder: 1,
    stripeProductId: "prod_123",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const mockSubscriptionRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockPlanRepo = {
      findById: jest.fn(),
    };

    const mockTierRepo = {
      findByPlanIdAndBillingPeriod: jest.fn(),
    };

    const mockUserRepo = {
      findByIdWithActiveMemberships: jest.fn(),
    };

    const mockStripeSync = {
      updateSubscriptionQuantity: jest.fn(),
      createPaymentIntent: jest.fn(),
    };

    const mockEventStore = {
      publish: jest.fn(),
    };

    const mockClassRepo = {
      countByOrganization: jest.fn().mockResolvedValue(0),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };

    subscriptionRepository = mockSubscriptionRepo as any;
    subscriptionPlanRepository = mockPlanRepo as any;
    pricingTierRepository = mockTierRepo as any;
    userRepository = mockUserRepo as any;
    stripeSyncService = mockStripeSync as any;
    eventStore = mockEventStore as any;
    classRepository = mockClassRepo;
    logger = mockLogger as any;
    useCase = new UpdateSubscriptionQuantityUseCase(
      logger,
      subscriptionRepository,
      subscriptionPlanRepository,
      pricingTierRepository,
      userRepository,
      stripeSyncService,
      eventStore,
      classRepository
    );
  });


  it("should update quantity successfully for downgrade", async () => {
    const subscription = SubscriptionEntity.create({
      userId: "user-id",
      organizationId: "org-id",
      planId: "plan-id",
      billingPeriod: "monthly",
      quantity: 10,
    });

    const input = {
      subscriptionId: subscription.id,
      newQuantity: 3,
      organizationId: "org-id",
      userId: "user-id",
    };

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(mockUser);
    subscriptionRepository.findById.mockResolvedValue(subscription);
    subscriptionPlanRepository.findById.mockResolvedValue(mockPlan);

    const mockTier = PricingTierEntity.create({
      planId: "plan-id",
      billingPeriod: "monthly",
      minClasses: 1,
      maxClasses: 20,
      pricePerClassCents: 1000,
      stripePriceId: "price_123",
    });

    pricingTierRepository.findByPlanIdAndBillingPeriod.mockResolvedValue([mockTier]);
    stripeSyncService.updateSubscriptionQuantity.mockResolvedValue({
      id: "sub_123",
      quantity: 3,
    } as any);
    subscriptionRepository.save.mockResolvedValue(subscription);

    const result = await useCase.execute(input);

    expect(result.isUpgrade).toBe(false);
    expect(result.newQuantity).toBe(3);
  });

  it("should throw error for invalid quantity", async () => {
    const input = {
      subscriptionId: mockSubscription.id,
      newQuantity: 25,
      organizationId: "org-id",
      userId: "user-id",
    };

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

  it("should throw error when subscription not found", async () => {
    const input = {
      subscriptionId: "non-existent",
      newQuantity: 10,
      organizationId: "org-id",
      userId: "user-id",
    };

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(mockUser);
    subscriptionRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

  it("should throw error when quantity unchanged", async () => {
    const input = {
      subscriptionId: mockSubscription.id,
      newQuantity: 5,
      organizationId: "org-id",
      userId: "user-id",
    };

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(mockUser);
    subscriptionRepository.findById.mockResolvedValue(mockSubscription);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

  it("should throw error when subscription is not active", async () => {
    const cancelledSubscription = SubscriptionEntity.reconstitute({
      ...mockSubscription.toPersistence(),
      status: "cancelled",
    });

    const input = {
      subscriptionId: cancelledSubscription.id,
      newQuantity: 10,
      organizationId: "org-id",
      userId: "user-id",
    };

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(mockUser);
    subscriptionRepository.findById.mockResolvedValue(cancelledSubscription);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

});

