import { IRepository } from "src/core";
import { ResponseEntity } from "../entities/response.entity";

export interface IResponseRepository extends IRepository<ResponseEntity> {
  create(entity: ResponseEntity): Promise<ResponseEntity>;
  findByQuiz(quizId: string): Promise<ResponseEntity[]>;
  findByFingerprint(fingerprint: string): Promise<ResponseEntity | null>;
  findByQuizAndFingerprint(quizId: string, fingerprint: string): Promise<ResponseEntity | null>;
  countByQuiz(quizId: string): Promise<number>;
}

