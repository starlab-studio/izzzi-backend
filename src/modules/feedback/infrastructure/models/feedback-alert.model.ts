import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { IFeedbackAlert } from "../../domain/types";

@Entity({ name: "feedback_alerts" })
@Index(["alertId", "subjectId"], { unique: true })
@Index(["subjectId"])
@Index(["organizationId"])
@Index(["type"])
@Index(["priority"])
@Index(["timestamp"])
@Index(["subjectId", "type"])
export class FeedbackAlertModel implements IFeedbackAlert {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "alert_id", type: "varchar", length: 255 })
  alertId: string;

  @Column({ name: "subject_id", type: "uuid" })
  subjectId: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ name: "is_processed", type: "boolean", default: false })
  isProcessed: boolean;

  @Column({ name: "processed_by_user_id", type: "uuid", nullable: true })
  processedByUserId: string | null;

  @Column({ name: "processed_at", type: "timestamp", nullable: true })
  processedAt: Date | null;

  @Column({
    name: "type",
    type: "enum",
    enum: ["negative", "alert", "positive"],
    nullable: false,
  })
  type: "negative" | "alert" | "positive";

  @Column({ name: "title", type: "varchar", length: 255, nullable: false })
  title: string;

  @Column({ name: "content", type: "text", nullable: false })
  content: string;

  @Column({
    name: "priority",
    type: "enum",
    enum: ["low", "medium", "high", "urgent"],
    nullable: false,
  })
  priority: "low" | "medium" | "high" | "urgent";

  @Column({ name: "number", type: "varchar", length: 50, nullable: false })
  number: string;

  @Column({ name: "timestamp", type: "timestamp", nullable: false })
  timestamp: Date;

  @Column({ name: "evidence", type: "jsonb", nullable: true })
  evidence?: string[];

  @Column({
    name: "form_type",
    type: "enum",
    enum: ["during_course", "after_course"],
    nullable: true,
  })
  formType?: "during_course" | "after_course";

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}
