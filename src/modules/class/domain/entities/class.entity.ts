import { randomUUID } from "crypto";
import { IClass, IClassCreate } from "../types";
import { DomainError, ErrorCode } from "src/core";
import { GeneralUtils } from "src/utils/general.utils";

export class Class {
  private props: IClass;

  private constructor(props: IClass) {
    this.props = props;
  }

  public static create(
    name: string,
    description: string | null,
    numberOfStudents: number,
    studentEmails: string[],
    organizationId: string,
    userId: string
  ): Class {
    Class.validateName(name);
    Class.validateNumberOfStudents(numberOfStudents);
    Class.validateStudentEmails(studentEmails, numberOfStudents);

    const now = new Date();

    return new Class({
      id: randomUUID(),
      name: name.trim(),
      code: Class.generateCode(name),
      numberOfStudents: numberOfStudents,
      studentEmails: studentEmails,
      description: description,
      accessToken: GeneralUtils.generateToken(32),
      isActive: true,
      organizationId: organizationId,
      userId: userId,
      createdAt: now,
      updatedAt: now,
    });
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new DomainError(
        ErrorCode.INVALID_CLASS_NAME,
        "Class name is required",
      );
    }

    if (name.trim().length < 1) {
      throw new DomainError(
        ErrorCode.INVALID_CLASS_NAME,
        "Class name must contain at least 1 character",
      );
    }
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
    numberOfStudents: number
  ): void {
    if (!studentEmails || studentEmails.length === 0) {
      throw new DomainError(
        ErrorCode.INVALID_STUDENT_EMAILS,
        "Student emails are required",
      );
    }

    const uniqueEmails = new Set(studentEmails.map(email => email.toLowerCase().trim()));
    
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

  toPersistence(): IClass {
    return { ...this.props };
  }

  static reconstitute(data: IClass): Class {
    return new Class(data);
  }
}
