import { Entity, Column, PrimaryColumn } from "typeorm";
import { IQuizTemplatePair } from "../../domain/types";

@Entity({ name: "quiz_template_pairs" })
export class QuizTemplatePairModel implements IQuizTemplatePair {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ name: "during_course_template_id", type: "uuid" })
  duringCourseTemplateId: string;

  @Column({ name: "after_course_template_id", type: "uuid" })
  afterCourseTemplateId: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "display_order", type: "integer", default: 0 })
  displayOrder: number;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;
}

