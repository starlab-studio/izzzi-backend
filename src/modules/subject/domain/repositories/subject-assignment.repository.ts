import { IRepository } from "src/core";
import { SubjectAssignmentEntity } from "../entities/subject-assignment.entity";

export interface ISubjectAssignmentRepository
  extends IRepository<SubjectAssignmentEntity> {
  assign(entity: SubjectAssignmentEntity): Promise<SubjectAssignmentEntity>;
  findBySubjectAndClass(
    subjectId: string,
    classId: string,
  ): Promise<SubjectAssignmentEntity | null>;
  findBySubject(subjectId: string): Promise<SubjectAssignmentEntity[]>;
  findByClass(classId: string): Promise<SubjectAssignmentEntity[]>;
  updateOrder(
    subjectId: string,
    classId: string,
    orderIndex: number,
  ): Promise<SubjectAssignmentEntity>;
  toggleActive(
    subjectId: string,
    classId: string,
    isActive: boolean,
  ): Promise<SubjectAssignmentEntity>;
  remove(subjectId: string, classId: string): Promise<void>;
}
