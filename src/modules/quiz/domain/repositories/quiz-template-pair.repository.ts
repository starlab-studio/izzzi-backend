import { IRepository } from "src/core";
import { QuizTemplatePairEntity } from "../entities/quiz-template-pair.entity";

export interface IQuizTemplatePairRepository extends IRepository<QuizTemplatePairEntity> {
  findAllActive(): Promise<QuizTemplatePairEntity[]>;
  findById(id: string): Promise<QuizTemplatePairEntity | null>;
}

