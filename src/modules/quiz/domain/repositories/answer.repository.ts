import { IRepository } from "src/core";
import { AnswerEntity } from "../entities/answer.entity";

export interface IAnswerRepository extends IRepository<AnswerEntity> {
  create(entity: AnswerEntity): Promise<AnswerEntity>;
  findByResponse(responseId: string): Promise<AnswerEntity[]>;
  findByQuiz(quizId: string): Promise<AnswerEntity[]>;
}
