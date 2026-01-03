import { IFeedbackAlert } from "../types";
import { BaseEntity } from "src/core/domain/entities/base.entity";
import { randomUUID } from "crypto";
import { ErrorCode } from "src/core";

export class FeedbackAlertEntity extends BaseEntity {
  private props: IFeedbackAlert;

  private constructor(props: IFeedbackAlert) {
    super();
    this.props = props;
  }

  static create(data: {
    alertId: string;
    subjectId: string;
    organizationId: string;
    type: "negative" | "alert" | "positive";
    title: string;
    content: string;
    priority: "low" | "medium" | "high" | "urgent";
    number: string;
    timestamp: Date;
    evidence?: string[];
    formType?: "during_course" | "after_course";
    processedByUserId?: string | null;
  }): FeedbackAlertEntity {
    const alertId = (data.alertId ?? "").trim();
    BaseEntity.validateRequiredString(
      alertId,
      "Alert ID",
      ErrorCode.UNEXPECTED_ERROR
    );

    const subjectId = (data.subjectId ?? "").trim();
    BaseEntity.validateRequiredString(
      subjectId,
      "Subject ID",
      ErrorCode.UNEXPECTED_ERROR
    );

    const organizationId = (data.organizationId ?? "").trim();
    BaseEntity.validateRequiredString(
      organizationId,
      "Organization ID",
      ErrorCode.UNEXPECTED_ERROR
    );

    const title = (data.title ?? "").trim();
    BaseEntity.validateRequiredString(
      title,
      "Title",
      ErrorCode.UNEXPECTED_ERROR
    );

    const content = (data.content ?? "").trim();
    BaseEntity.validateRequiredString(
      content,
      "Content",
      ErrorCode.UNEXPECTED_ERROR
    );

    const number = (data.number ?? "").trim();
    BaseEntity.validateRequiredString(
      number,
      "Number",
      ErrorCode.UNEXPECTED_ERROR
    );

    return new FeedbackAlertEntity({
      id: randomUUID(),
      alertId,
      subjectId,
      organizationId,
      isProcessed: false,
      processedByUserId: data.processedByUserId || null,
      processedAt: null,
      type: data.type,
      title,
      content,
      priority: data.priority,
      number,
      timestamp: data.timestamp,
      evidence: data.evidence || undefined,
      formType: data.formType || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(data: IFeedbackAlert): FeedbackAlertEntity {
    return new FeedbackAlertEntity(data);
  }

  markAsProcessed(userId: string): void {
    const userIdTrimmed = (userId ?? "").trim();
    BaseEntity.validateRequiredString(
      userIdTrimmed,
      "User ID",
      ErrorCode.UNEXPECTED_ERROR
    );

    this.props.isProcessed = true;
    this.props.processedByUserId = userIdTrimmed;
    this.props.processedAt = new Date();
    this.props.updatedAt = new Date();
  }

  markAsUnprocessed(): void {
    this.props.isProcessed = false;
    this.props.processedByUserId = null;
    this.props.processedAt = null;
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }

  get alertId(): string {
    return this.props.alertId;
  }

  get subjectId(): string {
    return this.props.subjectId;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get isProcessed(): boolean {
    return this.props.isProcessed;
  }

  get processedByUserId(): string | null {
    return this.props.processedByUserId;
  }

  get processedAt(): Date | null {
    return this.props.processedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get type(): "negative" | "alert" | "positive" {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get content(): string {
    return this.props.content;
  }

  get priority(): "low" | "medium" | "high" | "urgent" {
    return this.props.priority;
  }

  get number(): string {
    return this.props.number;
  }

  get timestamp(): Date {
    return this.props.timestamp;
  }

  get evidence(): string[] | undefined {
    return this.props.evidence;
  }

  get formType(): "during_course" | "after_course" | undefined {
    return this.props.formType;
  }

  toPersistence(): IFeedbackAlert {
    return { ...this.props };
  }
}
