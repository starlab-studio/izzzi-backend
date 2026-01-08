import { IQuizTemplate, IQuizTemplateQuestion } from "../types";
import { BaseEntity } from "src/core/domain/entities/base.entity";
import { ErrorCode } from "src/core";
import { randomUUID } from "crypto";

export class QuizTemplateEntity extends BaseEntity {
  private props: IQuizTemplate;
  private questions: IQuizTemplateQuestion[] = [];

  private constructor(props: IQuizTemplate) {
    super();
    this.props = props;
  }

  static create(data: {
    type: "during_course" | "after_course";
    name: string;
    description?: string | null;
    previewImageUrl?: string | null;
    displayOrder?: number;
  }): QuizTemplateEntity {
    const name = (data.name ?? "").trim();
    BaseEntity.validateRequiredString(
      name,
      "Template name",
      ErrorCode.UNEXPECTED_ERROR,
    );

    const type = data.type;
    if (type !== "during_course" && type !== "after_course") {
      throw new Error("Invalid template type");
    }

    return new QuizTemplateEntity({
      id: randomUUID(),
      type,
      name,
      description: data.description ?? null,
      previewImageUrl: data.previewImageUrl ?? null,
      isActive: true,
      displayOrder: data.displayOrder ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(data: IQuizTemplate): QuizTemplateEntity {
    return new QuizTemplateEntity(data);
  }

  setQuestions(questions: IQuizTemplateQuestion[]): void {
    this.questions = questions;
  }

  get id(): string {
    return this.props.id;
  }
  get type(): "during_course" | "after_course" {
    return this.props.type;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get previewImageUrl(): string | null {
    return this.props.previewImageUrl;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get displayOrder(): number {
    return this.props.displayOrder;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get questionsList(): IQuizTemplateQuestion[] {
    return [...this.questions];
  }

  toPersistence(): IQuizTemplate {
    return { ...this.props };
  }
}
