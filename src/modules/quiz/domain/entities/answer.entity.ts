import { IAnswer } from "../types";
import { BaseEntity } from "src/core/domain/entities/base.entity";
import { randomUUID } from "crypto";

export class AnswerEntity extends BaseEntity {
  private props: IAnswer;

  private constructor(props: IAnswer) {
    super();
    this.props = props;
  }

  static create(data: {
    responseId: string;
    questionId: string;
    valueStars?: number | null;
    valueRadio?: string | null;
    valueCheckbox?: string[] | null;
    valueText?: string | null;
  }): AnswerEntity {
    return new AnswerEntity({
      id: randomUUID(),
      responseId: data.responseId,
      questionId: data.questionId,
      valueStars: data.valueStars ?? null,
      valueRadio: data.valueRadio ?? null,
      valueCheckbox: data.valueCheckbox ?? null,
      valueText: data.valueText ?? null,
      createdAt: new Date(),
    });
  }

  static reconstitute(data: IAnswer): AnswerEntity {
    return new AnswerEntity(data);
  }

  get id(): string {
    return this.props.id;
  }
  get responseId(): string {
    return this.props.responseId;
  }
  get questionId(): string {
    return this.props.questionId;
  }
  get valueStars(): number | null {
    return this.props.valueStars;
  }
  get valueRadio(): string | null {
    return this.props.valueRadio;
  }
  get valueCheckbox(): string[] | null {
    return this.props.valueCheckbox;
  }
  get valueText(): string | null {
    return this.props.valueText;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  toPersistence(): IAnswer {
    return { ...this.props };
  }
}

