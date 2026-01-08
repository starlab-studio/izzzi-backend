import { IRepository } from "src/core";
import { StudentQuizTokenEntity } from "../entities/student-quiz-token.entity";

export interface IStudentQuizTokenRepository
  extends IRepository<StudentQuizTokenEntity> {
  create(entity: StudentQuizTokenEntity): Promise<StudentQuizTokenEntity>;
  findByQuiz(quizId: string): Promise<StudentQuizTokenEntity[]>;
  findByQuizAndNotResponded(quizId: string): Promise<StudentQuizTokenEntity[]>;
  findByToken(token: string): Promise<StudentQuizTokenEntity | null>;
  save(entity: StudentQuizTokenEntity): Promise<StudentQuizTokenEntity>;
}
