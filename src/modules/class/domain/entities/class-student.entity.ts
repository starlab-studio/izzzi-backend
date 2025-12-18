import { randomUUID } from "crypto";
import { IClassStudent, IClassStudentCreate } from "../types";
import { DomainError, ErrorCode, BaseEntity } from "src/core";

export class ClassStudentEntity extends BaseEntity {
  private props: IClassStudent;

  private constructor(props: IClassStudent) {
    super();
    this.props = props;
  }

  public static create(data: IClassStudentCreate): ClassStudentEntity {
    ClassStudentEntity.validateRequiredString(
      data.email,
      "Student email",
      ErrorCode.INVALID_STUDENT_EMAILS,
    );

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      throw new DomainError(
        ErrorCode.INVALID_STUDENT_EMAILS,
        "Invalid email format",
      );
    }

    const now = new Date();

    return new ClassStudentEntity({
      id: randomUUID(),
      classId: data.classId,
      email: data.email.trim().toLowerCase(),
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get classId(): string {
    return this.props.classId;
  }

  get email(): string {
    return this.props.email;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  toPersistence(): IClassStudent {
    return { ...this.props };
  }

  static reconstitute(data: IClassStudent): ClassStudentEntity {
    return new ClassStudentEntity(data);
  }
}

