import { IQuiz } from "../types";
import { ErrorCode } from "src/core";
import { randomUUID } from "crypto";
import { BaseEntity } from "src/core/domain/entities/base.entity";

export class QuizEntity extends BaseEntity {
  private props: IQuiz;

  private constructor(props: IQuiz) {
    super();
    this.props = props;
  }

  static create(data: {
    subjectId: string;
    templateId: string;
    type: "during_course" | "after_course";
    accessToken: string;
    publicUrl?: string | null;
    qrCodeUrl?: string | null;
  }): QuizEntity {
    const subjectId = (data.subjectId ?? "").trim();
    BaseEntity.validateRequiredString(
      subjectId,
      "Subject ID",
      ErrorCode.UNEXPECTED_ERROR,
    );

    const templateId = (data.templateId ?? "").trim();
    BaseEntity.validateRequiredString(
      templateId,
      "Template ID",
      ErrorCode.UNEXPECTED_ERROR,
    );

    const accessToken = (data.accessToken ?? "").trim();
    BaseEntity.validateRequiredString(
      accessToken,
      "Access token",
      ErrorCode.UNEXPECTED_ERROR,
    );

    return new QuizEntity({
      id: randomUUID(),
      subjectId,
      templateId,
      type: data.type,
      status: "draft",
      accessToken,
      qrCodeUrl: data.qrCodeUrl ?? null,
      publicUrl: data.publicUrl ?? null,
      activatedAt: null,
      closedAt: null,
      responseCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  activate(): void {
    this.props.status = "active";
    this.props.activatedAt = new Date();
    this.props.updatedAt = new Date();
  }

  updateUrls(publicUrl: string | null, qrCodeUrl: string | null): void {
    this.props.publicUrl = publicUrl;
    this.props.qrCodeUrl = qrCodeUrl;
    this.props.updatedAt = new Date();
  }

  incrementResponseCount(): void {
    this.props.responseCount += 1;
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get subjectId(): string {
    return this.props.subjectId;
  }
  get templateId(): string {
    return this.props.templateId;
  }
  get type(): "during_course" | "after_course" {
    return this.props.type;
  }
  get status(): "draft" | "active" | "closed" {
    return this.props.status;
  }
  get accessToken(): string {
    return this.props.accessToken;
  }
  get qrCodeUrl(): string | null {
    return this.props.qrCodeUrl;
  }
  get publicUrl(): string | null {
    return this.props.publicUrl;
  }
  get activatedAt(): Date | null {
    return this.props.activatedAt;
  }
  get closedAt(): Date | null {
    return this.props.closedAt;
  }
  get responseCount(): number {
    return this.props.responseCount;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toPersistence(): IQuiz {
    return { ...this.props };
  }

  static reconstitute(data: IQuiz): QuizEntity {
    return new QuizEntity(data);
  }
}
