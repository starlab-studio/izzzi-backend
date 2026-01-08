import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { IEmailLog } from "../../domain/notification.types";

@Entity({ name: "email_logs" })
@Index(["recipientEmail"])
@Index(["recipientUserId"])
export class EmailLogModel implements IEmailLog {
  @PrimaryColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: [
      "registration_confirmation",
      "password_reset",
      "class_created",
      "class_archived",
      "quiz_reminder",
      "ai_alert",
    ],
  })
  type:
    | "registration_confirmation"
    | "password_reset"
    | "class_created"
    | "class_archived"
    | "quiz_reminder"
    | "ai_alert";

  @Column({ name: "recipient_email", type: "varchar", length: 255 })
  recipientEmail: string;

  @Column({ name: "recipient_user_id", type: "uuid", nullable: true })
  recipientUserId: string | null;

  @Column({ type: "varchar", length: 255 })
  subject: string;

  @Column({
    type: "enum",
    enum: ["pending", "sent", "failed", "bounced"],
    default: "pending",
  })
  status: "pending" | "sent" | "failed" | "bounced";

  @Column({
    name: "provider_message_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  providerMessageId: string | null;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: "sent_at", type: "timestamp", nullable: true })
  sentAt: Date | null;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;
}
