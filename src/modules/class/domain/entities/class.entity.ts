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
    description: string | null | undefined, // Accepter undefined temporairement
    numberOfStudents: number,
    studentEmails: string[],
    organizationId: string,
    userId: string
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
      description: normalizedDescription, // Utiliser la valeur normalisée
      accessToken: GeneralUtils.generateToken(32),
      isActive: true,
      organizationId: organizationId,
      userId: userId,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Supprimer validateName - remplacé par BaseEntity.validateRequiredString et validateMinLength

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

  static reconstitute(data: IClass): ClassEntity {
    return new ClassEntity(data);
  }
}
