import { IStudentQuizToken } from "../types";
import { ErrorCode } from "src/core";
import { randomUUID } from "crypto";
import { BaseEntity } from "src/core/domain/entities/base.entity";

export class StudentQuizTokenEntity extends BaseEntity {
  private props: IStudentQuizToken;

  private constructor(props: IStudentQuizToken) {
    super();
    this.props = props;
  }

  static create(data: {
    quizId: string;
    classStudentId: string;
    token: string;
  }): StudentQuizTokenEntity {
    const quizId = (data.quizId ?? "").trim();
    BaseEntity.validateRequiredString(
      quizId,
      "Quiz ID",
      ErrorCode.UNEXPECTED_ERROR,
    );

    const classStudentId = (data.classStudentId ?? "").trim();
    BaseEntity.validateRequiredString(
      classStudentId,
      "Class student ID",
      ErrorCode.UNEXPECTED_ERROR,
    );

    const token = (data.token ?? "").trim();
    BaseEntity.validateRequiredString(
      token,
      "Token",
      ErrorCode.UNEXPECTED_ERROR,
    );

    return new StudentQuizTokenEntity({
      id: randomUUID(),
      quizId,
      classStudentId,
      token,
      hasResponded: false,
      respondedAt: null,
      emailSentAt: null,
      reminderCount: 0,
      lastReminderAt: null,
      createdAt: new Date(),
    });
  }

  markAsResponded(): void {
    this.props.hasResponded = true;
    this.props.respondedAt = new Date();
  }

  markEmailSent(): void {
    this.props.emailSentAt = new Date();
  }

  incrementReminderCount(): void {
    this.props.reminderCount += 1;
    this.props.lastReminderAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get quizId(): string {
    return this.props.quizId;
  }
  get classStudentId(): string {
    return this.props.classStudentId;
  }
  get token(): string {
    return this.props.token;
  }
  get hasResponded(): boolean {
    return this.props.hasResponded;
  }
  get respondedAt(): Date | null {
    return this.props.respondedAt;
  }
  get emailSentAt(): Date | null {
    return this.props.emailSentAt;
  }
  get reminderCount(): number {
    return this.props.reminderCount;
  }
  get lastReminderAt(): Date | null {
    return this.props.lastReminderAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  toPersistence(): IStudentQuizToken {
    return { ...this.props };
  }

  static reconstitute(data: IStudentQuizToken): StudentQuizTokenEntity {
    return new StudentQuizTokenEntity(data);
  }
}

