import { SubjectSummaryEntity } from "../entities/subject-summary.entity";

export interface ISubjectSummaryRepository {
  create(entity: SubjectSummaryEntity): Promise<SubjectSummaryEntity>;
  update(
    id: string,
    entity: Partial<SubjectSummaryEntity>,
  ): Promise<SubjectSummaryEntity>;
  findById(id: string): Promise<SubjectSummaryEntity | null>;
  findBySubjectIdAndFormType(
    subjectId: string,
    periodDays: number,
    formType: "during_course" | "after_course",
  ): Promise<SubjectSummaryEntity | null>;
  findBySubjectIdsAndFormType(
    subjectIds: string[],
    periodDays: number,
    formType: "during_course" | "after_course",
  ): Promise<SubjectSummaryEntity[]>;
  upsert(entity: SubjectSummaryEntity): Promise<SubjectSummaryEntity>;
  delete(id: string): Promise<void>;
}
