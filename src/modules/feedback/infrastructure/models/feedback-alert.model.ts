import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { IFeedbackAlert } from "../../domain/types";

@Entity({ name: "feedback_alerts" })
@Index(["alertId", "subjectId"], { unique: true })
@Index(["subjectId"])
@Index(["organizationId"])
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

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}
