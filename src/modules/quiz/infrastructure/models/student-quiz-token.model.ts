import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { IStudentQuizToken } from "../../domain/types";

@Entity({ name: "student_quiz_tokens" })
@Index(["token"], { unique: true })
@Index(["quizId", "classStudentId"], { unique: true })
export class StudentQuizTokenModel implements IStudentQuizToken {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "quiz_id", type: "uuid" })
  quizId: string;

  @Column({ name: "class_student_id", type: "uuid" })
  classStudentId: string;

  @Column({ type: "varchar", length: 255, unique: true })
  token: string;

  @Column({ name: "has_responded", type: "boolean", default: false })
  hasResponded: boolean;

  @Column({ name: "responded_at", type: "timestamp", nullable: true })
  respondedAt: Date | null;

  @Column({ name: "email_sent_at", type: "timestamp", nullable: true })
  emailSentAt: Date | null;

  @Column({ name: "reminder_count", type: "integer", default: 0 })
  reminderCount: number;

  @Column({ name: "last_reminder_at", type: "timestamp", nullable: true })
  lastReminderAt: Date | null;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;
}

