import { randomUUID } from "crypto";
import { ISubscriptionPlan } from "../types";

export class SubscriptionPlanEntity {
  private props: ISubscriptionPlan;

  private constructor(props: ISubscriptionPlan) {
    this.props = props;
  }

  public static create(
    data: Pick<
      ISubscriptionPlan,
      | "name"
      | "displayPrice"
      | "priceSubtext"
      | "basePriceCents"
      | "trialPeriodDays"
      | "isFree"
      | "variant"
      | "displayOrder"
      | "stripeProductId"
    >
  ): SubscriptionPlanEntity {
    const now = new Date();
    return new SubscriptionPlanEntity({
      id: randomUUID(),
      ...data,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(data: ISubscriptionPlan): SubscriptionPlanEntity {
    return new SubscriptionPlanEntity(data);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get displayPrice(): string {
    return this.props.displayPrice;
  }

  get priceSubtext(): string | null {
    return this.props.priceSubtext;
  }

  get basePriceCents(): number {
    return this.props.basePriceCents;
  }

  get trialPeriodDays(): number {
    return this.props.trialPeriodDays;
  }

  get isFree(): boolean {
    return this.props.isFree;
  }

  get variant(): "default" | "premium" {
    return this.props.variant;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get stripeProductId(): string | null {
    return this.props.stripeProductId;
  }

  toPersistence(): ISubscriptionPlan {
    return { ...this.props };
  }
}
