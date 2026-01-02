import { IAlertComment } from "../types";
import { BaseEntity } from "src/core/domain/entities/base.entity";
import { randomUUID } from "crypto";
import { ErrorCode } from "src/core";

export class AlertCommentEntity extends BaseEntity {
  private props: IAlertComment;

  private constructor(props: IAlertComment) {
    super();
    this.props = props;
  }

  static create(data: {
    alertId: string;
    subjectId: string;
    organizationId: string;
    userId: string;
    comment: string;
  }): AlertCommentEntity {
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

    const userId = (data.userId ?? "").trim();
    BaseEntity.validateRequiredString(
      userId,
      "User ID",
      ErrorCode.UNEXPECTED_ERROR
    );

    const comment = (data.comment ?? "").trim();
    BaseEntity.validateRequiredString(
      comment,
      "Comment",
      ErrorCode.UNEXPECTED_ERROR
    );

    return new AlertCommentEntity({
      id: randomUUID(),
      alertId,
      subjectId,
      organizationId,
      userId,
      comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(data: IAlertComment): AlertCommentEntity {
    return new AlertCommentEntity(data);
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

  get userId(): string {
    return this.props.userId;
  }

  get comment(): string {
    return this.props.comment;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toPersistence(): IAlertComment {
    return { ...this.props };
  }
}
