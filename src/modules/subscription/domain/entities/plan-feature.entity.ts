import { randomUUID } from "crypto";
import { IPlanFeature } from "../types";

export class PlanFeatureEntity {
  private props: IPlanFeature;

  private constructor(props: IPlanFeature) {
    this.props = props;
  }

  public static create(
    data: Pick<
      IPlanFeature,
      | "planId"
      | "featureText"
      | "featureSubtext"
      | "section"
      | "displayOrder"
      | "isComingSoon"
    >
  ): PlanFeatureEntity {
    return new PlanFeatureEntity({
      id: randomUUID(),
      ...data,
      createdAt: new Date(),
    });
  }

  public static reconstitute(data: IPlanFeature): PlanFeatureEntity {
    return new PlanFeatureEntity(data);
  }

  get id(): string {
    return this.props.id;
  }

  get planId(): string {
    return this.props.planId;
  }

  get featureText(): string {
    return this.props.featureText;
  }

  get featureSubtext(): string | null {
    return this.props.featureSubtext;
  }

  get section(): "main" | "additional" {
    return this.props.section;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isComingSoon(): boolean {
    return this.props.isComingSoon;
  }

  toPersistence(): IPlanFeature {
    return { ...this.props };
  }
}
