import { Test, TestingModule } from "@nestjs/testing";
import { CreateSubscriptionUseCase } from "src/modules/subscription/application/use-cases/CreateSubscription.use-case";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { IPricingTierRepository } from "src/modules/subscription/domain/repositories/pricing-tier.repository";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { IPaymentService } from "src/modules/subscription/domain/services/payment.service";
import { IStripeSyncService } from "src/modules/payment/domain/services/stripe-sync.service";
import { ILoggerService, DomainError, UserRole, LoggerService } from "src/core";
import { UserEntity } from "src/modules/organization/domain/entities/user.entity";
import { MembershipEntity } from "src/modules/organization/domain/entities/membership.entity";
import { SubscriptionPlanEntity } from "src/modules/subscription/domain/entities/subscription-plan.entity";
import { PricingTierEntity } from "src/modules/subscription/domain/entities/pricing-tier.entity";

describe("CreateSubscriptionUseCase", () => {
  let useCase: CreateSubscriptionUseCase;
  let subscriptionPlanRepository: jest.Mocked<ISubscriptionPlanRepository>;
  let pricingTierRepository: jest.Mocked<IPricingTierRepository>;
  let subscriptionRepository: jest.Mocked<ISubscriptionRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let paymentService: jest.Mocked<IPaymentService>;
  let stripeSyncService: jest.Mocked<IStripeSyncService>;
  let logger: jest.Mocked<ILoggerService>;

  const mockUser = {
    id: "user-id",
    hasRoleInOrganization: jest.fn().mockReturnValue(true),
    belongsToOrganization: jest.fn().mockReturnValue(false),
  } as any;

  const mockPlan = SubscriptionPlanEntity.reconstitute({
    id: "plan-id",
    name: "Test Plan",
    displayPrice: "10€",
    priceSubtext: null,
    basePriceCents: 1000,
    trialPeriodDays: 14,
    isFree: false,
    variant: "default" as const,
    displayOrder: 1,
    stripeProductId: "prod_123",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const mockSubscriptionPlanRepo = {
      findById: jest.fn(),
    };

    const mockPricingTierRepo = {
      findByPlanIdAndBillingPeriod: jest.fn(),
      save: jest.fn(),
    };

    const mockSubscriptionRepo = {
      findActiveByOrganizationId: jest.fn(),
      save: jest.fn(),
    };

    const mockUserRepo = {
      findByIdWithActiveMemberships: jest.fn(),
    };

    const mockPaymentService = {
      createCheckoutSession: jest.fn(),
    };

    const mockStripeSyncService = {
      syncPricingTiersToStripe: jest.fn(),
      getOrCreateCustomer: jest.fn(),
      createSubscription: jest.fn(),
      getSubscription: jest.fn(),
      getInvoice: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };

    subscriptionPlanRepository = mockSubscriptionPlanRepo as any;
    pricingTierRepository = mockPricingTierRepo as any;
    subscriptionRepository = mockSubscriptionRepo as any;
    userRepository = mockUserRepo as any;
    paymentService = mockPaymentService as any;
    stripeSyncService = mockStripeSyncService as any;
    logger = mockLogger as any;
    useCase = new CreateSubscriptionUseCase(
      logger,
      subscriptionPlanRepository,
      pricingTierRepository,
      subscriptionRepository,
      userRepository,
      paymentService,
      stripeSyncService
    );
  });


  it("should throw error for invalid quantity", async () => {
    const input = {
      userId: "user-id",
      organizationId: "org-id",
      planId: "plan-id",
      quantity: 25,
    };

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

  it("should throw error when user not found", async () => {
    const input = {
      userId: "non-existent",
      organizationId: "org-id",
      planId: "plan-id",
      quantity: 5,
    };

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow("Utilisateur non trouvé");
  });

  it("should throw error when user is not admin", async () => {
    const input = {
      userId: "user-id",
      organizationId: "org-id",
      planId: "plan-id",
      quantity: 5,
    };

    const nonAdminUser = {
      ...mockUser,
      hasRoleInOrganization: jest.fn().mockReturnValue(false),
    };

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(nonAdminUser);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow("administrateur");
  });

  it("should throw error when subscription already exists", async () => {
    const input = {
      userId: "user-id",
      organizationId: "org-id",
      planId: "plan-id",
      quantity: 5,
    };

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(mockUser);
    subscriptionRepository.findActiveByOrganizationId.mockResolvedValue({
      id: "existing-sub",
    } as any);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow("déjà une subscription active");
  });

  it("should throw error when plan not found", async () => {
    const input = {
      userId: "user-id",
      organizationId: "org-id",
      planId: "non-existent",
      quantity: 5,
    };

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(mockUser);
    subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(null);
    subscriptionPlanRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

  it("should throw error when plan is not active", async () => {
    const input = {
      userId: "user-id",
      organizationId: "org-id",
      planId: "plan-id",
      quantity: 5,
    };

    const inactivePlan = SubscriptionPlanEntity.reconstitute({
      ...mockPlan.toPersistence(),
      isActive: false,
    });

    userRepository.findByIdWithActiveMemberships.mockResolvedValue(mockUser);
    subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(null);
    subscriptionPlanRepository.findById.mockResolvedValue(inactivePlan);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

});

