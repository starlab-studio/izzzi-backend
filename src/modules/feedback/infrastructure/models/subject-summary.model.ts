import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseModel } from "src/core";
import { SubjectModel } from "src/modules/subject/infrastructure/models/subject.model";
import { OrganizationModel } from "src/modules/organization/infrastructure/models/organization.model";

@Entity({ name: "subject_summaries" })
@Unique("UQ_subject_summaries_subject_period_form_type", [
  "subjectId",
  "periodDays",
  "formType",
])
export class SubjectSummaryModel extends BaseModel {
  @Column({ name: "subject_id", type: "uuid" })
  subjectId!: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId!: string;

  @Column({ type: "text" })
  summary!: string;

  @Column({ name: "full_summary", type: "text", nullable: true })
  fullSummary?: string;

  @Column({
    name: "sentiment_score",
    type: "decimal",
    precision: 3,
    scale: 2,
    nullable: true,
  })
  sentimentScore?: number;

  @Column({ name: "period_days", type: "integer", default: 30 })
  periodDays!: number;

  @Column({ name: "form_type", type: "varchar", length: 50 })
  formType!: "during_course" | "after_course";

  @Column({ name: "feedback_count_at_generation", type: "integer" })
  feedbackCountAtGeneration!: number;

  @Column({ name: "generated_at", type: "timestamp" })
  generatedAt!: Date;

  @ManyToOne(() => SubjectModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "subject_id" })
  subject?: SubjectModel;

  @ManyToOne(() => OrganizationModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organization_id" })
  organization?: OrganizationModel;
}
