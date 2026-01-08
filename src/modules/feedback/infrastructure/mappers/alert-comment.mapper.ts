import { AlertCommentModel } from "../models/alert-comment.model";
import { AlertCommentEntity } from "../../domain/entities/alert-comment.entity";
import { IAlertComment } from "../../domain/types";

export class AlertCommentMapper {
  static toEntity(model: AlertCommentModel): AlertCommentEntity {
    return AlertCommentEntity.reconstitute(model);
  }

  static toEntities(models: AlertCommentModel[]): AlertCommentEntity[] {
    return models.map((model) => this.toEntity(model));
  }

  static toPersistence(entity: AlertCommentEntity): IAlertComment {
    return entity.toPersistence();
  }
}
