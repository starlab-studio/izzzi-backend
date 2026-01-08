import { IRepository } from "src/core";
import { QuizEntity } from "../entities/quiz.entity";

export interface IQuizRepository extends IRepository<QuizEntity> {
  create(entity: QuizEntity): Promise<QuizEntity>;
  findById(id: string): Promise<QuizEntity | null>;
  findByAccessToken(accessToken: string): Promise<QuizEntity | null>;
  findBySubject(subjectId: string): Promise<QuizEntity[]>;
  findBySubjectAndType(
    subjectId: string,
    type: "during_course" | "after_course",
  ): Promise<QuizEntity | null>;
  save(entity: QuizEntity): Promise<QuizEntity>;
  delete(id: string): Promise<void>;
}
