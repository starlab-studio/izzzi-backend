import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { IAiAnalysis } from "../../domain/types";

@Entity({ name: "ai_analyses" })
@Index(["quizId"])
@Index(["subjectId"])
export class AiAnalysisModel implements IAiAnalysis {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "quiz_id", type: "uuid" })
  quizId: string;

  @Column({ name: "subject_id", type: "uuid" })
  subjectId: string;

  @Column({ type: "varchar", length: 100 })
  model: string; // 'claude-3', 'gpt-4', 'mistral'

  @Column({ name: "summary_text", type: "text" })
  summaryText: string;

  @Column({ name: "global_score", type: "decimal", precision: 3, scale: 2, nullable: true })
  globalScore: number | null; // 0.00 - 5.00

  @Column({ 
    type: "enum", 
    enum: ["positive", "negative", "neutral", "mixed"], 
    nullable: true 
  })
  sentiment: "positive" | "negative" | "neutral" | "mixed" | null;

  @Column({ 
    name: "alert_type", 
    type: "enum", 
    enum: ["none", "positive", "negative"], 
    default: "none" 
  })
  alertType: "none" | "positive" | "negative";

  @Column({ name: "alert_message", type: "text", nullable: true })
  alertMessage: string | null;

  @Column({ name: "key_points", type: "jsonb", nullable: true })
  keyPoints: string[] | null;

  @Column({ name: "recommendations", type: "jsonb", nullable: true })
  recommendations: string[] | null;

  @Column({ name: "confidence", type: "decimal", precision: 3, scale: 2, nullable: true })
  confidence: number | null; // 0.00 - 1.00

  @Column({ name: "tokens_used", type: "integer", nullable: true })
  tokensUsed: number | null;

  @Column({ name: "triggered_email", type: "boolean", default: false })
  triggeredEmail: boolean;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;
}

