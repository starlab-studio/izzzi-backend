import { FeedbackAlertModel } from "../models/feedback-alert.model";
import { FeedbackAlertEntity } from "../../domain/entities/feedback-alert.entity";
import { IFeedbackAlert } from "../../domain/types";

export class FeedbackAlertMapper {
  static toEntity(model: FeedbackAlertModel): FeedbackAlertEntity {
    return FeedbackAlertEntity.reconstitute(model);
  }

  static toEntities(models: FeedbackAlertModel[]): FeedbackAlertEntity[] {
    return models.map((model) => this.toEntity(model));
  }

  static toPersistence(entity: FeedbackAlertEntity): IFeedbackAlert {
    return entity.toPersistence();
  }
}
