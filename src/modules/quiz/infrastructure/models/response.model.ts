import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { IResponse } from "../../domain/types";

@Entity({ name: "responses" })
@Index(["quizId"])
export class ResponseModel implements IResponse {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "quiz_id", type: "uuid" })
  quizId: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  fingerprint: string | null; // Hash pour éviter doublons

  @Column({ name: "submitted_at", type: "timestamp" })
  submittedAt: Date;

  @Column({ name: "completion_time_seconds", type: "integer", nullable: true })
  completionTimeSeconds: number | null;

  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent: string | null;

  @Column({ name: "is_complete", type: "boolean", default: true })
  isComplete: boolean;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;
}

