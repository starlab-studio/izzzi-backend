import { randomUUID } from "crypto";
import { IUserSubscription } from "../types";

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "pending"
  | "failed";

export type StripeSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete";

export class SubscriptionEntity {
  private props: IUserSubscription;

  private constructor(props: IUserSubscription) {
    this.props = props;
  }

  public static create(data: {
    userId: string;
    organizationId: string;
    planId: string;
    billingPeriod: "monthly" | "annual";
    quantity: number;
    trialDays?: number;
  }): SubscriptionEntity {
    const now = new Date();
    const {
      userId,
      organizationId,
      planId,
      billingPeriod,
      quantity,
      trialDays,
    } = data;

    if (quantity < 1 || quantity > 20) {
      throw new Error("Quantity must be between 1 and 20");
    }

    let status: SubscriptionStatus;
    let trialStartDate: Date | null = null;
    let trialEndDate: Date | null = null;
    let currentPeriodStart: Date | null = null;
    let currentPeriodEnd: Date | null = null;

    if (trialDays && trialDays > 0) {
      status = "trial";
      trialStartDate = now;
      trialEndDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      currentPeriodStart = now;
      currentPeriodEnd = trialEndDate;
    } else {
      status = "active";
      currentPeriodStart = now;

      const periodEnd = new Date(now);
      if (billingPeriod === "monthly") {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }
      currentPeriodEnd = periodEnd;
    }

    return new SubscriptionEntity({
      id: randomUUID(),
      userId,
      organizationId,
      planId,
      billingPeriod,
      quantity,
      pendingQuantity: null,
      status,
      trialStartDate,
      trialEndDate,
      currentPeriodStart,
      currentPeriodEnd,
      cancelledAt: null,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static createPending(data: {
    userId: string;
    organizationId: string;
    planId: string;
    billingPeriod: "monthly" | "annual";
    quantity: number;
    stripeCustomerId?: string | null;
  }): SubscriptionEntity {
    const now = new Date();
    const {
      userId,
      organizationId,
      planId,
      billingPeriod,
      quantity,
      stripeCustomerId = null,
    } = data;

    if (quantity < 1 || quantity > 20) {
      throw new Error("Quantity must be between 1 and 20");
    }

    return new SubscriptionEntity({
      id: randomUUID(),
      userId,
      organizationId,
      planId,
      billingPeriod,
      quantity,
      pendingQuantity: null,
      status: "pending",
      trialStartDate: null,
      trialEndDate: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelledAt: null,
      stripeSubscriptionId: null,
      stripeCustomerId,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(data: IUserSubscription): SubscriptionEntity {
    return new SubscriptionEntity(data);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get planId(): string {
    return this.props.planId;
  }

  get billingPeriod(): "monthly" | "annual" {
    return this.props.billingPeriod;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get pendingQuantity(): number | null {
    return this.props.pendingQuantity;
  }

  get status(): SubscriptionStatus {
    return this.props.status;
  }

  get trialStartDate(): Date | null {
    return this.props.trialStartDate;
  }

  get trialEndDate(): Date | null {
    return this.props.trialEndDate;
  }

  get currentPeriodStart(): Date | null {
    return this.props.currentPeriodStart;
  }

  get currentPeriodEnd(): Date | null {
    return this.props.currentPeriodEnd;
  }

  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }

  get stripeSubscriptionId(): string | null {
    return this.props.stripeSubscriptionId;
  }

  get stripeCustomerId(): string | null {
    return this.props.stripeCustomerId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isActive(): boolean {
    return this.props.status === "active" || this.props.status === "trial";
  }

  get isTrialing(): boolean {
    return this.props.status === "trial";
  }

  get canUpgrade(): boolean {
    return this.isActive && this.props.quantity < 20;
  }

  get canDowngrade(): boolean {
    return this.isActive && this.props.quantity > 1;
  }

  get isCancelled(): boolean {
    return this.props.status === "cancelled" || this.props.cancelledAt !== null;
  }

  get isPastDue(): boolean {
    return this.props.status === "past_due";
  }

  updateQuantity(newQuantity: number, immediate: boolean = true): void {
    if (newQuantity < 1 || newQuantity > 20) {
      throw new Error("Quantity must be between 1 and 20");
    }

    if (!this.isActive) {
      throw new Error("Cannot update quantity for inactive subscription");
    }

    if (newQuantity === this.props.quantity && !this.props.pendingQuantity) {
      return;
    }

    if (immediate) {
      // Upgrade : effet immédiat
      this.props.quantity = newQuantity;
      this.props.pendingQuantity = null;
    } else {
      // Downgrade : effet à la fin de période
      this.props.pendingQuantity = newQuantity;
    }

    this.props.updatedAt = new Date();
  }

  linkToStripe(stripeSubscriptionId: string, stripeCustomerId: string): void {
    if (!stripeSubscriptionId || !stripeCustomerId) {
      throw new Error("Stripe subscription ID and customer ID are required");
    }

    this.props.stripeSubscriptionId = stripeSubscriptionId;
    this.props.stripeCustomerId = stripeCustomerId;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (this.props.status === "active") {
      return;
    }

    if (this.props.status !== "trial" && this.props.status !== "pending") {
      throw new Error(
        `Cannot activate subscription with status: ${this.props.status}`
      );
    }

    const previousStatus = this.props.status;
    this.props.status = "active";
    this.props.updatedAt = new Date();

    const now = new Date();
    if (!this.props.currentPeriodStart) {
      this.props.currentPeriodStart = now;
    }

    if (!this.props.currentPeriodEnd) {
      const periodEnd = new Date(now);
      if (this.props.billingPeriod === "monthly") {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }
      this.props.currentPeriodEnd = periodEnd;
    }

    if (this.props.trialEndDate && previousStatus === "trial") {
      this.props.currentPeriodStart = now;
      this.props.currentPeriodEnd = this.props.trialEndDate;
    }
  }

  markFailed(): void {
    if (this.props.status === "failed") {
      return;
    }

    if (this.props.status !== "pending") {
      throw new Error(
        `Cannot mark subscription as failed with status: ${this.props.status}`
      );
    }

    this.props.status = "failed";
    this.props.updatedAt = new Date();
  }

  markPastDue(): void {
    if (this.props.status === "past_due") {
      return;
    }

    if (!this.isActive) {
      throw new Error("Cannot mark inactive subscription as past due");
    }

    this.props.status = "past_due";
    this.props.updatedAt = new Date();
  }

  scheduleCancellation(): void {
    if (this.isCancelled) {
      return;
    }

    if (!this.isActive) {
      throw new Error("Cannot schedule cancellation for inactive subscription");
    }

    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (this.isCancelled) {
      return;
    }

    this.props.status = "cancelled";
    this.props.cancelledAt = new Date();
    this.props.updatedAt = new Date();
  }

  renewPeriod(): void {
    if (!this.isActive) {
      throw new Error("Cannot renew period for inactive subscription");
    }

    const now = new Date();
    this.props.currentPeriodStart = now;

    const periodEnd = new Date(now);
    if (this.props.billingPeriod === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    this.props.currentPeriodEnd = periodEnd;

    // Appliquer pendingQuantity si présent (downgrade programmé)
    if (this.props.pendingQuantity !== null) {
      this.props.quantity = this.props.pendingQuantity;
      this.props.pendingQuantity = null;
    }

    this.props.updatedAt = new Date();
  }

  changePlan(newPlanId: string): void {
    if (!newPlanId) {
      throw new Error("Plan ID is required");
    }

    if (!this.isActive) {
      throw new Error("Cannot change plan for inactive subscription");
    }

    if (this.props.planId === newPlanId) {
      return;
    }

    this.props.planId = newPlanId;
    this.props.updatedAt = new Date();
  }

  syncFromStripe(data: {
    status: StripeSubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    quantity?: number;
  }): void {
    const statusMap: Record<StripeSubscriptionStatus, SubscriptionStatus> = {
      trialing: "trial",
      active: "active",
      past_due: "past_due",
      canceled: "cancelled",
      unpaid: "expired",
      incomplete: "trial",
    };

    const mappedStatus = statusMap[data.status];
    if (mappedStatus) {
      this.props.status = mappedStatus;
    }
    this.props.currentPeriodStart = data.currentPeriodStart;
    this.props.currentPeriodEnd = data.currentPeriodEnd;

    if (data.quantity !== undefined) {
      if (data.quantity < 1 || data.quantity > 20) {
        throw new Error("Stripe quantity must be between 1 and 20");
      }
      this.props.quantity = data.quantity;
    }

    if (data.cancelAtPeriodEnd) {
      const now = new Date();
      if (!this.props.cancelledAt || this.props.cancelledAt > now) {
        this.props.cancelledAt = data.currentPeriodEnd;
      }
    } else {
      const now = new Date();
      if (this.props.cancelledAt && this.props.cancelledAt > now) {
        this.props.cancelledAt = null;
        if (this.props.status === "cancelled") {
          this.props.status = "active";
        }
      }
    }

    this.props.updatedAt = new Date();
  }

  expire(): void {
    if (this.props.status === "expired") {
      return;
    }

    this.props.status = "expired";
    this.props.updatedAt = new Date();
  }

  toPersistence(): IUserSubscription {
    return { ...this.props };
  }
}
