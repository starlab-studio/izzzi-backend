import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { IAnswer } from "../../domain/types";

@Entity({ name: "answers" })
@Index(["responseId"])
@Index(["questionId"])
export class AnswerModel implements IAnswer {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "response_id", type: "uuid" })
  responseId: string;

  @Column({ name: "question_id", type: "uuid" })
  questionId: string;

  @Column({ name: "value_stars", type: "integer", nullable: true })
  valueStars: number | null;

  @Column({ name: "value_radio", type: "varchar", length: 255, nullable: true })
  valueRadio: string | null;

  @Column({ name: "value_checkbox", type: "jsonb", nullable: true })
  valueCheckbox: string[] | null;

  @Column({ name: "value_text", type: "text", nullable: true })
  valueText: string | null;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;
}
