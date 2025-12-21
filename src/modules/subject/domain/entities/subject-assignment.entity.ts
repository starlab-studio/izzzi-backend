import { BaseEntity } from "src/core/domain/entities/base.entity";
import { ISubjectAssignment, ISubjectAssignmentCreate } from "../types";

export class SubjectAssignmentEntity extends BaseEntity {
  private props: ISubjectAssignment;

  private constructor(props: ISubjectAssignment) {
    super();
    this.props = props;
  }

  static create(data: ISubjectAssignmentCreate): SubjectAssignmentEntity {
    const subjectId = (data.subjectId ?? "").trim();
    this.validateRequiredString(subjectId, "Subject id");
    const classId = (data.classId ?? "").trim();
    this.validateRequiredString(classId, "Class id");
    const orderIndex = Math.max(1, data.orderIndex ?? 1);

    return new SubjectAssignmentEntity({
      subjectId,
      classId,
      orderIndex,
      isActive: true,
      createdAt: new Date(),
    });
  }

  get subjectId(): string {
    return this.props.subjectId;
  }
  get classId(): string {
    return this.props.classId;
  }
  get orderIndex(): number {
    return this.props.orderIndex;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  toPersistence(): ISubjectAssignment {
    return { ...this.props };
  }

  static reconstitute(data: ISubjectAssignment): SubjectAssignmentEntity {
    return new SubjectAssignmentEntity(data);
  }
}
