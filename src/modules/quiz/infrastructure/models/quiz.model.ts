import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { IQuiz } from "../../domain/types";

@Entity({ name: "quizzes" })
@Index(["accessToken"], { unique: true })
export class QuizModel implements IQuiz {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "subject_id", type: "uuid" })
  subjectId: string;

  @Column({ name: "template_id", type: "uuid" })
  templateId: string;

  @Column({ type: "enum", enum: ["during_course", "after_course"] })
  type: "during_course" | "after_course";

  @Column({ 
    type: "enum", 
    enum: ["draft", "active", "closed"], 
    default: "draft" 
  })
  status: "draft" | "active" | "closed";

  @Column({ name: "access_token", type: "varchar", length: 255, unique: true })
  accessToken: string;

  @Column({ name: "qr_code_url", type: "text", nullable: true })
  qrCodeUrl: string | null;

  @Column({ name: "public_url", type: "varchar", length: 500, nullable: true })
  publicUrl: string | null;

  @Column({ name: "activated_at", type: "timestamp", nullable: true })
  activatedAt: Date | null;

  @Column({ name: "closed_at", type: "timestamp", nullable: true })
  closedAt: Date | null;

  @Column({ name: "response_count", type: "integer", default: 0 })
  responseCount: number;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}

