import { Entity, Column, PrimaryColumn } from "typeorm";
import { IUserSubscription } from "../../domain/types";

@Entity({ name: "user_subscriptions" })
export class UserSubscriptionModel implements IUserSubscription {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ name: "plan_id", type: "uuid" })
  planId: string;

  @Column({ name: "billing_period", type: "enum", enum: ["monthly", "annual"] })
  billingPeriod: "monthly" | "annual";

  @Column({ type: "integer", default: 0 })
  quantity: number;

  @Column({
    name: "pending_quantity",
    type: "integer",
    nullable: true,
  })
  pendingQuantity: number | null;

  @Column({
    type: "enum",
    enum: ["trial", "active", "past_due", "cancelled", "expired"],
    default: "trial",
  })
  status: "trial" | "active" | "past_due" | "cancelled" | "expired";

  @Column({ name: "trial_start_date", type: "timestamp", nullable: true })
  trialStartDate: Date | null;

  @Column({ name: "trial_end_date", type: "timestamp", nullable: true })
  trialEndDate: Date | null;

  @Column({ name: "current_period_start", type: "timestamp", nullable: true })
  currentPeriodStart: Date | null;

  @Column({ name: "current_period_end", type: "timestamp", nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ name: "cancelled_at", type: "timestamp", nullable: true })
  cancelledAt: Date | null;

  @Column({
    name: "stripe_subscription_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  stripeSubscriptionId: string | null;

  @Column({
    name: "stripe_customer_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  stripeCustomerId: string | null;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}
