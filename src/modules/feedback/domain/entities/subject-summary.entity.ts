import { ISubjectSummary } from "../types";
import { BaseEntity } from "src/core/domain/entities/base.entity";
import { randomUUID } from "crypto";
import { ErrorCode } from "src/core";

export class SubjectSummaryEntity extends BaseEntity {
  private props: ISubjectSummary;

  private constructor(props: ISubjectSummary) {
    super();
    this.props = props;
  }

  static create(data: {
    subjectId: string;
    organizationId: string;
    summary: string;
    fullSummary?: string;
    sentimentScore?: number;
    periodDays?: number;
    formType: "during_course" | "after_course";
    feedbackCountAtGeneration: number;
    generatedAt: Date;
  }): SubjectSummaryEntity {
    const subjectId = (data.subjectId ?? "").trim();
    BaseEntity.validateRequiredString(
      subjectId,
      "Subject ID",
      ErrorCode.UNEXPECTED_ERROR,
    );

    const organizationId = (data.organizationId ?? "").trim();
    BaseEntity.validateRequiredString(
      organizationId,
      "Organization ID",
      ErrorCode.UNEXPECTED_ERROR,
    );

    const summary = (data.summary ?? "").trim();
    BaseEntity.validateRequiredString(
      summary,
      "Summary",
      ErrorCode.UNEXPECTED_ERROR,
    );

    if (data.formType !== "during_course" && data.formType !== "after_course") {
      const formTypeStr = String(data.formType);
      throw new Error(
        `Invalid formType: ${formTypeStr}. Must be "during_course" or "after_course"`,
      );
    }

    const now = new Date();

    return new SubjectSummaryEntity({
      id: randomUUID(),
      subjectId,
      organizationId,
      summary,
      fullSummary: data.fullSummary,
      sentimentScore: data.sentimentScore,
      periodDays: data.periodDays || 30,
      formType: data.formType,
      feedbackCountAtGeneration: data.feedbackCountAtGeneration,
      generatedAt: data.generatedAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(data: ISubjectSummary): SubjectSummaryEntity {
    return new SubjectSummaryEntity(data);
  }

  update(data: {
    summary?: string;
    fullSummary?: string;
    sentimentScore?: number;
    periodDays?: number;
    feedbackCountAtGeneration?: number;
    generatedAt?: Date;
  }): void {
    if (data.summary !== undefined) {
      const summary = (data.summary ?? "").trim();
      BaseEntity.validateRequiredString(
        summary,
        "Summary",
        ErrorCode.UNEXPECTED_ERROR,
      );
      this.props.summary = summary;
    }
    if (data.fullSummary !== undefined)
      this.props.fullSummary = data.fullSummary;
    if (data.sentimentScore !== undefined)
      this.props.sentimentScore = data.sentimentScore;
    if (data.periodDays !== undefined) this.props.periodDays = data.periodDays;
    if (data.feedbackCountAtGeneration !== undefined)
      this.props.feedbackCountAtGeneration = data.feedbackCountAtGeneration;
    if (data.generatedAt !== undefined)
      this.props.generatedAt = data.generatedAt;
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }

  get subjectId(): string {
    return this.props.subjectId;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get summary(): string {
    return this.props.summary;
  }

  get fullSummary(): string | undefined {
    return this.props.fullSummary;
  }

  get sentimentScore(): number | undefined {
    return this.props.sentimentScore;
  }

  get periodDays(): number {
    return this.props.periodDays;
  }

  get formType(): "during_course" | "after_course" {
    return this.props.formType;
  }

  get feedbackCountAtGeneration(): number {
    return this.props.feedbackCountAtGeneration;
  }

  get generatedAt(): Date {
    return this.props.generatedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toPersistence(): ISubjectSummary {
    return { ...this.props };
  }
}
