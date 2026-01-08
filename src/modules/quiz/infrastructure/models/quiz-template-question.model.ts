import { Entity, Column, PrimaryColumn } from "typeorm";
import { IQuizTemplateQuestion } from "../../domain/types";

@Entity({ name: "quiz_template_questions" })
export class QuizTemplateQuestionModel implements IQuizTemplateQuestion {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "template_id", type: "uuid" })
  templateId: string;

  @Column({ type: "text" })
  text: string;

  @Column({
    type: "enum",
    enum: ["stars", "radio", "checkbox", "textarea"],
  })
  type: "stars" | "radio" | "checkbox" | "textarea";

  @Column({ type: "jsonb", nullable: true })
  options: string[] | null; // Pour radio/checkbox

  @Column({ name: "validation_rules", type: "jsonb", nullable: true })
  validationRules: {
    required?: boolean;
    min_length?: number;
    max_length?: number;
  } | null;

  @Column({ name: "order_index", type: "integer", default: 0 })
  orderIndex: number;

  @Column({
    type: "enum",
    enum: ["global", "course", "instructor"],
    default: "course",
  })
  category: "global" | "course" | "instructor";

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;
}
