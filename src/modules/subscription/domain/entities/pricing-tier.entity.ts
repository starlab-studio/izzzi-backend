import { randomUUID } from "crypto";
import { IPricingTier } from "../types";

export class PricingTierEntity {
  private props: IPricingTier;

  private constructor(props: IPricingTier) {
    this.props = props;
  }

  public static create(
    data: Pick<
      IPricingTier,
      | "planId"
      | "billingPeriod"
      | "minClasses"
      | "maxClasses"
      | "pricePerClassCents"
    >
  ): PricingTierEntity {
    return new PricingTierEntity({
      id: randomUUID(),
      ...data,
      createdAt: new Date(),
    });
  }

  public static reconstitute(data: IPricingTier): PricingTierEntity {
    return new PricingTierEntity(data);
  }

  get id(): string {
    return this.props.id;
  }

  get planId(): string {
    return this.props.planId;
  }

  get billingPeriod(): "monthly" | "annual" {
    return this.props.billingPeriod;
  }

  get minClasses(): number {
    return this.props.minClasses;
  }

  get maxClasses(): number {
    return this.props.maxClasses;
  }

  get pricePerClassCents(): number {
    return this.props.pricePerClassCents;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toPersistence(): IPricingTier {
    return { ...this.props };
  }
}
