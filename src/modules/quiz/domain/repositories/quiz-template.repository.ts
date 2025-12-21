import { IRepository } from "src/core";
import { QuizTemplateEntity } from "../entities/quiz-template.entity";

export interface IQuizTemplateRepository extends IRepository<QuizTemplateEntity> {
  create(entity: QuizTemplateEntity): Promise<QuizTemplateEntity>;
  findById(id: string): Promise<QuizTemplateEntity | null>;
  findByIds(ids: string[]): Promise<QuizTemplateEntity[]>;
}

