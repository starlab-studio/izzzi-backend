import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { IQuizReminder } from "../../domain/types";

@Entity({ name: "quiz_reminders" })
@Index(["quizId"])
export class QuizReminderModel implements IQuizReminder {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "quiz_id", type: "uuid" })
  quizId: string;

  @Column({ name: "scheduled_at", type: "timestamp" })
  scheduledAt: Date;

  @Column({ name: "sent_at", type: "timestamp", nullable: true })
  sentAt: Date | null;

  @Column({
    type: "enum",
    enum: ["scheduled", "sending", "sent", "failed", "cancelled"],
    default: "scheduled",
  })
  status: "scheduled" | "sending" | "sent" | "failed" | "cancelled";

  @Column({ name: "recipient_count", type: "integer", default: 0 })
  recipientCount: number;

  @Column({ name: "success_count", type: "integer", default: 0 })
  successCount: number;

  @Column({ name: "failure_count", type: "integer", default: 0 })
  failureCount: number;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId: string;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;
}
