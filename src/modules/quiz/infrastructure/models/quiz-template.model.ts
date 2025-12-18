import { Entity, Column, PrimaryColumn } from "typeorm";
import { IQuizTemplate } from "../../domain/types";

@Entity({ name: "quiz_templates" })
export class QuizTemplateModel implements IQuizTemplate {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: ["during_course", "after_course"] })
  type: "during_course" | "after_course";

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ name: "preview_image_url", type: "varchar", length: 500, nullable: true })
  previewImageUrl: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "display_order", type: "integer", default: 0 })
  displayOrder: number;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}

