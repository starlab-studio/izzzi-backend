import { ClassLimitService } from "./class-limit.service";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { IClassRepository } from "../repositories/class.repository";
import { DomainError, ErrorCode } from "src/core";

describe("ClassLimitService", () => {
  let service: ClassLimitService;
  let mockSubscriptionRepository: jest.Mocked<ISubscriptionRepository>;
  let mockSubscriptionPlanRepository: jest.Mocked<ISubscriptionPlanRepository>;
  let mockClassRepository: jest.Mocked<IClassRepository>;

  const organizationId = "org-123";

  beforeEach(() => {
    mockSubscriptionRepository = {
      findActiveByOrganizationId: jest.fn(),
    } as any;

    mockSubscriptionPlanRepository = {
      findById: jest.fn(),
    } as any;

    mockClassRepository = {
      countByOrganization: jest.fn(),
    } as any;

    service = new ClassLimitService(
      mockSubscriptionRepository,
      mockSubscriptionPlanRepository,
      mockClassRepository
    );
  });

  it("should not allow creation if no subscription found", async () => {
    mockSubscriptionRepository.findActiveByOrganizationId.mockResolvedValue(null);

    const result = await service.canCreateClass(organizationId);

    expect(result.canCreate).toBe(false);
    expect(result.reason).toMatch(/souscrire à un abonnement/);
  });

  it("should not allow creation if subscription is pending", async () => {
    mockSubscriptionRepository.findActiveByOrganizationId.mockResolvedValue({
      status: "pending",
    } as any);

    const result = await service.canCreateClass(organizationId);

    expect(result.canCreate).toBe(false);
    expect(result.reason).toMatch(/pending payment/);
  });

  it("should throw error if plan not found", async () => {
    mockSubscriptionRepository.findActiveByOrganizationId.mockResolvedValue({
      status: "active",
      planId: "plan-123",
    } as any);
    mockSubscriptionPlanRepository.findById.mockResolvedValue(null);

    await expect(service.canCreateClass(organizationId)).rejects.toThrow(DomainError);
    await expect(service.canCreateClass(organizationId)).rejects.toHaveProperty(
        "errors.0.code",
        ErrorCode.PLAN_NOT_FOUND
    );
  });

  describe("Free Plan", () => {
    const freePlan = { isFree: true, id: "free-plan" } as any;

    it("should allow creation if trial is active", async () => {
      mockSubscriptionRepository.findActiveByOrganizationId.mockResolvedValue({
        status: "active",
        planId: "free-plan",
        isTrialActive: true,
      } as any);
      mockSubscriptionPlanRepository.findById.mockResolvedValue(freePlan);

      const result = await service.canCreateClass(organizationId);

      expect(result.canCreate).toBe(true);
    });

    it("should not allow creation if trial is expired", async () => {
      mockSubscriptionRepository.findActiveByOrganizationId.mockResolvedValue({
        status: "active",
        planId: "free-plan",
        isTrialActive: false,
      } as any);
      mockSubscriptionPlanRepository.findById.mockResolvedValue(freePlan);

      const result = await service.canCreateClass(organizationId);

      expect(result.canCreate).toBe(false);
      expect(result.reason).toMatch(/période d'essai est terminée/);
    });
  });

  describe("Paid Plan", () => {
    const paidPlan = { isFree: false, id: "paid-plan" } as any;

    it("should not allow creation if quantity is zero or less", async () => {
      mockSubscriptionRepository.findActiveByOrganizationId.mockResolvedValue({
        status: "active",
        planId: "paid-plan",
        quantity: 0,
      } as any);
      mockSubscriptionPlanRepository.findById.mockResolvedValue(paidPlan);

      const result = await service.canCreateClass(organizationId);

      expect(result.canCreate).toBe(false);
      expect(result.reason).toMatch(/does not allow creating classes/);
    });

    it("should allow creation if under limit", async () => {
      mockSubscriptionRepository.findActiveByOrganizationId.mockResolvedValue({
        status: "active",
        planId: "paid-plan",
        quantity: 5,
      } as any);
      mockSubscriptionPlanRepository.findById.mockResolvedValue(paidPlan);
      mockClassRepository.countByOrganization.mockResolvedValue(4);

      const result = await service.canCreateClass(organizationId);

      expect(result.canCreate).toBe(true);
    });

    it("should not allow creation if limit reached", async () => {
      mockSubscriptionRepository.findActiveByOrganizationId.mockResolvedValue({
        status: "active",
        planId: "paid-plan",
        quantity: 5,
        pendingQuantity: null
      } as any);
      mockSubscriptionPlanRepository.findById.mockResolvedValue(paidPlan);
      mockClassRepository.countByOrganization.mockResolvedValue(5);

      const result = await service.canCreateClass(organizationId);

      expect(result.canCreate).toBe(false);
      expect(result.reason).toMatch(/reached your class limit/);
    });
    
    it("should include pending quantity info in reason if limit reached", async () => {
      mockSubscriptionRepository.findActiveByOrganizationId.mockResolvedValue({
        status: "active",
        planId: "paid-plan",
        quantity: 5,
        pendingQuantity: 3
      } as any);
      mockSubscriptionPlanRepository.findById.mockResolvedValue(paidPlan);
      mockClassRepository.countByOrganization.mockResolvedValue(5);

      const result = await service.canCreateClass(organizationId);

      expect(result.canCreate).toBe(false);
      expect(result.reason).toMatch(/reduced to 3 classes/);
    });
  });
});