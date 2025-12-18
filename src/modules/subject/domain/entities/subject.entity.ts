import { ISubject, ISubjectCreate } from "../types";
import { ErrorCode } from "src/core";
import { randomUUID } from "crypto";
import { BaseEntity } from "src/core/domain/entities/base.entity";

export class SubjectEntity extends BaseEntity {
  private props: ISubject;

  private constructor(props: ISubject) {
    super();
    this.props = props;
  }

  static create(data: ISubjectCreate): SubjectEntity {
    const name = (data.name ?? "").trim();
    this.validateRequiredString(
      name,
      "Subject name",
      ErrorCode.INVALID_SUBJECT_NAME,
    );

    const organizationId = (data.organizationId ?? "").trim();

    const createdBy = (data.createdBy ?? "").trim();

    return new SubjectEntity({
      id: randomUUID(),
      name,
      isActive: true,
      instructorName: data.instructorName ?? null,
      instructorEmail: data.instructorEmail ?? null,
      firstCourseDate: data.firstCourseDate ?? null,
      lastCourseDate: data.lastCourseDate ?? null,
      organizationId,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  update(data: {
    name?: string;
    instructorName?: string | null;
    instructorEmail?: string | null;
    firstCourseDate?: Date | null;
    lastCourseDate?: Date | null;
  }): void {
    if (data.name !== undefined) {
      const name = data.name.trim();
      SubjectEntity.validateRequiredString(
        name,
        "Subject name",
        ErrorCode.INVALID_SUBJECT_NAME,
      );
      this.props.name = name;
    }

    if (data.instructorName !== undefined) {
      this.props.instructorName = data.instructorName;
    }

    if (data.instructorEmail !== undefined) {
      this.props.instructorEmail = data.instructorEmail;
    }

    if (data.firstCourseDate !== undefined) {
      this.props.firstCourseDate = data.firstCourseDate;
    }

    if (data.lastCourseDate !== undefined) {
      this.props.lastCourseDate = data.lastCourseDate;
    }

    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get instructorName(): string | null {
    return this.props.instructorName;
  }
  get instructorEmail(): string | null {
    return this.props.instructorEmail;
  }
  get firstCourseDate(): Date | null {
    return this.props.firstCourseDate;
  }
  get lastCourseDate(): Date | null {
    return this.props.lastCourseDate;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get createdBy(): string {
    return this.props.createdBy;
  }
  get createdAt(): Date | null {
    return this.props.createdAt;
  }
  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }
  toPersistence(): ISubject {
    return { ...this.props };
  }

  static reconstitute(data: ISubject): SubjectEntity {
    return new SubjectEntity(data);
  }
}
