import { Entity, Column, PrimaryColumn } from "typeorm";
import { ISubscriptionPlan } from "../../domain/types";

@Entity({ name: "subscription_plans" })
export class SubscriptionPlanModel implements ISubscriptionPlan {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100 })
  name: string; // 'izzzi', 'super-izzzi'

  @Column({ name: "display_price", type: "varchar", length: 50 })
  displayPrice: string;

  @Column({
    name: "price_subtext",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  priceSubtext: string | null;

  @Column({ name: "base_price_cents", type: "integer", default: 0 })
  basePriceCents: number;

  @Column({ name: "trial_period_days", type: "integer", default: 0 })
  trialPeriodDays: number;

  @Column({ name: "is_free", type: "boolean", default: false })
  isFree: boolean;

  @Column({ type: "enum", enum: ["default", "premium"], default: "default" })
  variant: "default" | "premium";

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "display_order", type: "integer", default: 0 })
  displayOrder: number;

  @Column({
    name: "stripe_product_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  stripeProductId: string | null;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}
