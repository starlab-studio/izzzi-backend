import { randomUUID } from "crypto";
import { IClass } from "../types";
import { DomainError, ErrorCode, BaseEntity } from "src/core";
import { GeneralUtils } from "src/utils/general.utils";

export class ClassEntity extends BaseEntity {
  private props: IClass;

  private constructor(props: IClass) {
    super();
    this.props = props;
  }

  public static create(
    name: string,
    description: string | null,
    numberOfStudents: number,
    studentEmails: string[],
    organizationId: string,
    userId: string,
  ): ClassEntity {
    ClassEntity.validateRequiredString(
      name,
      "Class name",
      ErrorCode.INVALID_CLASS_NAME,
    );
    ClassEntity.validateMinLength(
      name.trim(),
      1,
      "Class name",
      ErrorCode.INVALID_CLASS_NAME,
    );

    ClassEntity.validateNumberOfStudents(numberOfStudents);
    ClassEntity.validateStudentEmails(studentEmails, numberOfStudents);

    const normalizedDescription = description ?? null;

    const now = new Date();

    return new ClassEntity({
      id: randomUUID(),
      name: name.trim(),
      code: ClassEntity.generateCode(name),
      numberOfStudents: numberOfStudents,
      studentEmails: studentEmails,
      description: normalizedDescription,
      accessToken: GeneralUtils.generateToken(32),
      isActive: true,
      status: "active",
      archivedAt: null,
      organizationId: organizationId,
      userId: userId,
      createdAt: now,
      updatedAt: now,
    });
  }

  private static validateNumberOfStudents(numberOfStudents: number): void {
    if (numberOfStudents === undefined || numberOfStudents === null) {
      throw new DomainError(
        ErrorCode.INVALID_STUDENT_COUNT,
        "Number of students is required",
      );
    }

    if (!Number.isInteger(numberOfStudents) || numberOfStudents <= 0) {
      throw new DomainError(
        ErrorCode.INVALID_STUDENT_COUNT,
        "Number of students must be a positive integer",
      );
    }
  }

  private static validateStudentEmails(
    studentEmails: string[],
    numberOfStudents: number,
  ): void {
    if (!studentEmails || studentEmails.length === 0) {
      throw new DomainError(
        ErrorCode.INVALID_STUDENT_EMAILS,
        "Student emails are required",
      );
    }

    const uniqueEmails = new Set(
      studentEmails.map((email) => email.toLowerCase().trim()),
    );

    if (uniqueEmails.size !== studentEmails.length) {
      throw new DomainError(
        ErrorCode.INVALID_STUDENT_EMAILS,
        "Duplicate email addresses are not allowed",
      );
    }

    if (uniqueEmails.size !== numberOfStudents) {
      throw new DomainError(
        ErrorCode.EMAIL_COUNT_MISMATCH,
        `Number of unique emails (${uniqueEmails.size}) does not match the number of students (${numberOfStudents})`,
      );
    }
  }

  private static generateCode(name: string): string {
    const timestamp = Date.now();
    const random = GeneralUtils.generateToken(4);
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 10);
    return `${sanitizedName}-${timestamp}-${random}`;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get code(): string {
    return this.props.code;
  }

  get numberOfStudents(): number {
    return this.props.numberOfStudents;
  }

  get studentEmails(): string[] {
    return this.props.studentEmails;
  }

  get description(): string | null {
    return this.props.description;
  }

  get accessToken(): string {
    return this.props.accessToken;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get status(): "active" | "archived" {
    return this.props.status;
  }

  get archivedAt(): Date | null {
    return this.props.archivedAt;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get createdAt(): Date | null {
    return this.props.createdAt;
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }

  update(data: {
    name?: string;
    description?: string | null;
    numberOfStudents?: number;
    studentEmails?: string[];
  }): void {
    if (data.name !== undefined) {
      ClassEntity.validateRequiredString(
        data.name,
        "Class name",
        ErrorCode.INVALID_CLASS_NAME,
      );
      ClassEntity.validateMinLength(
        data.name.trim(),
        1,
        "Class name",
        ErrorCode.INVALID_CLASS_NAME,
      );
      this.props.name = data.name.trim();
    }

    if (data.description !== undefined) {
      this.props.description = data.description ?? null;
    }

    if (data.numberOfStudents !== undefined) {
      ClassEntity.validateNumberOfStudents(data.numberOfStudents);
      this.props.numberOfStudents = data.numberOfStudents;
    }

    if (data.studentEmails !== undefined) {
      ClassEntity.validateStudentEmails(
        data.studentEmails,
        data.numberOfStudents ?? this.props.numberOfStudents,
      );
      this.props.studentEmails = data.studentEmails;
    }

    this.props.updatedAt = new Date();
  }

  archive(): void {
    if (this.props.status === "archived") {
      throw new DomainError(
        ErrorCode.CLASS_ALREADY_ARCHIVED,
        "Class is already archived",
      );
    }
    this.props.isActive = false;
    this.props.status = "archived";
    this.props.archivedAt = new Date();
    this.props.updatedAt = new Date();
  }

  toPersistence(): IClass {
    return { ...this.props };
  }

  static reconstitute(data: IClass): ClassEntity {
    return new ClassEntity(data);
  }
}
