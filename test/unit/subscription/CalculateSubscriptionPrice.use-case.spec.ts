import { Test, TestingModule } from "@nestjs/testing";
import { CalculateSubscriptionPriceUseCase } from "src/modules/subscription/application/use-cases/CalculateSubscriptionPrice.use-case";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { IPricingTierRepository } from "src/modules/subscription/domain/repositories/pricing-tier.repository";
import { ILoggerService, DomainError, ErrorCode, LoggerService } from "src/core";
import { SubscriptionPlanEntity } from "src/modules/subscription/domain/entities/subscription-plan.entity";
import { PricingTierEntity } from "src/modules/subscription/domain/entities/pricing-tier.entity";

describe("CalculateSubscriptionPriceUseCase", () => {
  let useCase: CalculateSubscriptionPriceUseCase;
  let subscriptionPlanRepository: jest.Mocked<ISubscriptionPlanRepository>;
  let pricingTierRepository: jest.Mocked<IPricingTierRepository>;
  let logger: jest.Mocked<ILoggerService>;

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
    const mockPlanRepo = {
      findById: jest.fn(),
    };

    const mockTierRepo = {
      findByPlanIdAndBillingPeriod: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };

    subscriptionPlanRepository = mockPlanRepo as any;
    pricingTierRepository = mockTierRepo as any;
    logger = mockLogger as any;
    useCase = new CalculateSubscriptionPriceUseCase(logger, subscriptionPlanRepository, pricingTierRepository);
  });

  it("should calculate price for monthly billing", async () => {
    const input = {
      planId: "plan-id",
      classCount: 5,
      billingPeriod: "monthly" as const,
    };

    subscriptionPlanRepository.findById.mockResolvedValue(mockPlan);

    const mockTier = PricingTierEntity.create({
      planId: "plan-id",
      billingPeriod: "monthly",
      minClasses: 1,
      maxClasses: 10,
      pricePerClassCents: 1000,
      stripePriceId: "price_123",
    });

    pricingTierRepository.findByPlanIdAndBillingPeriod.mockResolvedValue([mockTier]);

    const result = await useCase.execute(input);

    expect(result.totalPriceCents).toBe(5000);
    expect(result.billingPeriod).toBe("monthly");
    expect(result.classCount).toBe(5);
  });

  it("should calculate price for annual billing", async () => {
    const input = {
      planId: "plan-id",
      classCount: 5,
      billingPeriod: "annual" as const,
    };

    subscriptionPlanRepository.findById.mockResolvedValue(mockPlan);

    const mockTier = PricingTierEntity.create({
      planId: "plan-id",
      billingPeriod: "annual",
      minClasses: 1,
      maxClasses: 10,
      pricePerClassCents: 1000,
      stripePriceId: "price_123",
    });

    pricingTierRepository.findByPlanIdAndBillingPeriod.mockResolvedValue([mockTier]);

    const result = await useCase.execute(input);

    expect(result.totalPriceCents).toBe(60000);
    expect(result.billingPeriod).toBe("annual");
  });

  it("should throw error for invalid class count", async () => {
    const input = {
      planId: "plan-id",
      classCount: 25,
    };

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

  it("should throw error when plan not found", async () => {
    const input = {
      planId: "non-existent",
      classCount: 5,
    };

    subscriptionPlanRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

  it("should calculate price for free plan", async () => {
    const freePlan = SubscriptionPlanEntity.reconstitute({
      ...mockPlan.toPersistence(),
      isFree: true,
    });

    const input = {
      planId: "plan-id",
      classCount: 5,
    };

    subscriptionPlanRepository.findById.mockResolvedValue(freePlan);

    const mockTier = PricingTierEntity.create({
      planId: "plan-id",
      billingPeriod: "monthly",
      minClasses: 1,
      maxClasses: 20,
      pricePerClassCents: 0,
      stripePriceId: null,
    });

    pricingTierRepository.findByPlanIdAndBillingPeriod.mockResolvedValue([mockTier]);

    const result = await useCase.execute(input);

    expect(result.totalPriceCents).toBe(0);
  });
});

