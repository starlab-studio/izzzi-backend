import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { IAlertComment } from "../../domain/types";

@Entity({ name: "alert_comments" })
@Index(["alertId", "subjectId"])
@Index(["subjectId"])
@Index(["organizationId"])
export class AlertCommentModel implements IAlertComment {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "alert_id", type: "varchar", length: 255 })
  alertId: string;

  @Column({ name: "subject_id", type: "uuid" })
  subjectId: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ type: "text" })
  comment: string;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}
