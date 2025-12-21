import { Entity, Column, PrimaryColumn } from "typeorm";
import { IPlanFeature } from "../../domain/types";

@Entity({ name: "plan_features" })
export class PlanFeatureModel implements IPlanFeature {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "plan_id", type: "uuid" })
  planId: string;

  @Column({ name: "feature_text", type: "varchar", length: 500 })
  featureText: string;

  @Column({ name: "feature_subtext", type: "varchar", length: 500, nullable: true })
  featureSubtext: string | null;

  @Column({ type: "enum", enum: ["main", "additional"], default: "main" })
  section: "main" | "additional";

  @Column({ name: "display_order", type: "integer", default: 0 })
  displayOrder: number;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;
}

