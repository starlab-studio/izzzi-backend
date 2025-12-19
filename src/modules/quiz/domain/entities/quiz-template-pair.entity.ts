import { IQuizTemplatePair } from "../types";
import { BaseEntity } from "src/core/domain/entities/base.entity";

export class QuizTemplatePairEntity extends BaseEntity {
  private props: IQuizTemplatePair;

  private constructor(props: IQuizTemplatePair) {
    super();
    this.props = props;
  }

  static reconstitute(data: IQuizTemplatePair): QuizTemplatePairEntity {
    return new QuizTemplatePairEntity(data);
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get duringCourseTemplateId(): string {
    return this.props.duringCourseTemplateId;
  }
  get afterCourseTemplateId(): string {
    return this.props.afterCourseTemplateId;
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

  toPersistence(): IQuizTemplatePair {
    return { ...this.props };
  }
}

