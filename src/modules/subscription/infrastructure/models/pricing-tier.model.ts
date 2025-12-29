import { Entity, Column, PrimaryColumn } from "typeorm";
import { IPricingTier } from "../../domain/types";

@Entity({ name: "pricing_tiers" })
export class PricingTierModel implements IPricingTier {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "plan_id", type: "uuid" })
  planId: string;

  @Column({ name: "billing_period", type: "enum", enum: ["monthly", "annual"] })
  billingPeriod: "monthly" | "annual";

  @Column({ name: "min_classes", type: "integer" })
  minClasses: number;

  @Column({ name: "max_classes", type: "integer" })
  maxClasses: number;

  @Column({ name: "price_per_class_cents", type: "integer" })
  pricePerClassCents: number;

  @Column({
    name: "stripe_price_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  stripePriceId: string | null;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;
}
