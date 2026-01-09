import { SubscriptionEntity } from "src/modules/subscription/domain/entities/subscription.entity";

describe("SubscriptionEntity", () => {
  describe("create", () => {
    it("should create subscription with active status", () => {
      const subscription = SubscriptionEntity.create({
        userId: "user-id",
        organizationId: "org-id",
        planId: "plan-id",
        billingPeriod: "monthly",
        quantity: 5,
      });

      expect(subscription.status).toBe("active");
      expect(subscription.quantity).toBe(5);
      expect(subscription.isActive).toBe(true);
    });

    it("should create subscription with trial status", () => {
      const subscription = SubscriptionEntity.create({
        userId: "user-id",
        organizationId: "org-id",
        planId: "plan-id",
        billingPeriod: "monthly",
        quantity: 5,
        trialDays: 14,
      });

      expect(subscription.status).toBe("trial");
      expect(subscription.isTrialing).toBe(true);
      expect(subscription.trialStartDate).toBeInstanceOf(Date);
      expect(subscription.trialEndDate).toBeInstanceOf(Date);
    });

    it("should throw error for invalid quantity", () => {
      expect(() => {
        SubscriptionEntity.create({
          userId: "user-id",
          organizationId: "org-id",
          planId: "plan-id",
          billingPeriod: "monthly",
          quantity: 25,
        });
      }).toThrow("Quantity must be between 1 and 20");
    });
  });

  describe("isActive", () => {
    it("should return true for active subscription", () => {
      const subscription = SubscriptionEntity.create({
        userId: "user-id",
        organizationId: "org-id",
        planId: "plan-id",
        billingPeriod: "monthly",
        quantity: 5,
      });

      expect(subscription.isActive).toBe(true);
    });

    it("should return true for trial subscription", () => {
      const subscription = SubscriptionEntity.create({
        userId: "user-id",
        organizationId: "org-id",
        planId: "plan-id",
        billingPeriod: "monthly",
        quantity: 5,
        trialDays: 14,
      });

      expect(subscription.isActive).toBe(true);
    });

    it("should return false for cancelled subscription", () => {
      const subscription = SubscriptionEntity.create({
        userId: "user-id",
        organizationId: "org-id",
        planId: "plan-id",
        billingPeriod: "monthly",
        quantity: 5,
      });

      subscription.cancel();

      expect(subscription.isActive).toBe(false);
    });
  });

  describe("updateQuantity", () => {
    it("should update quantity immediately for upgrade", () => {
      const subscription = SubscriptionEntity.create({
        userId: "user-id",
        organizationId: "org-id",
        planId: "plan-id",
        billingPeriod: "monthly",
        quantity: 5,
      });

      subscription.updateQuantity(10, true);

      expect(subscription.quantity).toBe(10);
      expect(subscription.pendingQuantity).toBeNull();
    });

    it("should set pending quantity for downgrade", () => {
      const subscription = SubscriptionEntity.create({
        userId: "user-id",
        organizationId: "org-id",
        planId: "plan-id",
        billingPeriod: "monthly",
        quantity: 10,
      });

      subscription.updateQuantity(5, false);

      expect(subscription.quantity).toBe(10);
      expect(subscription.pendingQuantity).toBe(5);
    });
  });
});

