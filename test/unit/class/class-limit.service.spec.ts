import { Test, TestingModule } from "@nestjs/testing";
import { ClassLimitService } from "src/modules/class/domain/services/class-limit.service";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { IClassRepository } from "src/modules/class/domain/repositories/class.repository";
import { DomainError, ErrorCode } from "src/core";
import { SubscriptionPlanEntity } from "src/modules/subscription/domain/entities/subscription-plan.entity";

describe("ClassLimitService", () => {
  let service: ClassLimitService;
  let subscriptionRepository: jest.Mocked<ISubscriptionRepository>;
  let subscriptionPlanRepository: jest.Mocked<ISubscriptionPlanRepository>;
  let classRepository: jest.Mocked<IClassRepository>;

  beforeEach(async () => {
    const mockSubscriptionRepo = {
      findActiveByOrganizationId: jest.fn(),
    };

    const mockPlanRepo = {
      findById: jest.fn(),
    };

    const mockClassRepo = {
      countByOrganization: jest.fn(),
    };

    subscriptionRepository = mockSubscriptionRepo as any;
    subscriptionPlanRepository = mockPlanRepo as any;
    classRepository = mockClassRepo as any;

    service = new ClassLimitService(
      subscriptionRepository,
      subscriptionPlanRepository,
      classRepository
    );
  });

  it("should return canCreate false when no subscription exists", async () => {
    subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(null);

    const result = await service.canCreateClass("org-id");

    expect(result.canCreate).toBe(false);
    expect(result.reason).toContain("abonnement");
  });

  it("should return canCreate false when subscription is pending", async () => {
    subscriptionRepository.findActiveByOrganizationId.mockResolvedValue({
      status: "pending",
    } as any);

    const result = await service.canCreateClass("org-id");

    expect(result.canCreate).toBe(false);
    expect(result.reason).toContain("pending");
  });

  it("should return canCreate true when limit not reached", async () => {
    const subscription = {
      id: "sub-id",
      planId: "plan-id",
      quantity: 10,
      status: "active",
    };

    const plan = SubscriptionPlanEntity.reconstitute({
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

    subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(subscription as any);
    subscriptionPlanRepository.findById.mockResolvedValue(plan);
    classRepository.countByOrganization.mockResolvedValue(5);

    const result = await service.canCreateClass("org-id");

    expect(result.canCreate).toBe(true);
  });

  it("should return canCreate false when limit is reached", async () => {
    const subscription = {
      id: "sub-id",
      planId: "plan-id",
      quantity: 5,
      status: "active",
    };

    const plan = SubscriptionPlanEntity.reconstitute({
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

    subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(subscription as any);
    subscriptionPlanRepository.findById.mockResolvedValue(plan);
    classRepository.countByOrganization.mockResolvedValue(5);

    const result = await service.canCreateClass("org-id");

    expect(result.canCreate).toBe(false);
    expect(result.reason).toContain("limit");
  });

  it("should throw error when plan not found", async () => {
    const subscription = {
      id: "sub-id",
      planId: "non-existent",
      status: "active",
    };

    subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(subscription as any);
    subscriptionPlanRepository.findById.mockResolvedValue(null);

    await expect(service.canCreateClass("org-id")).rejects.toThrow(DomainError);
  });
});

