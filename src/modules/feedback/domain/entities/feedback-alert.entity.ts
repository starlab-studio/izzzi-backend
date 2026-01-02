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

    return new FeedbackAlertEntity({
      id: randomUUID(),
      alertId,
      subjectId,
      organizationId,
      isProcessed: false,
      processedByUserId: data.processedByUserId || null,
      processedAt: null,
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

  toPersistence(): IFeedbackAlert {
    return { ...this.props };
  }
}
