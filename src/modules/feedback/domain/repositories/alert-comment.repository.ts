import { IRepository } from "src/core";
import { AlertCommentEntity } from "../entities/alert-comment.entity";

export interface IAlertCommentRepository
  extends IRepository<AlertCommentEntity> {
  create(entity: AlertCommentEntity): Promise<AlertCommentEntity>;
  findByAlertId(
    alertId: string,
    subjectId: string,
  ): Promise<AlertCommentEntity[]>;
  findById(id: string): Promise<AlertCommentEntity | null>;
}
