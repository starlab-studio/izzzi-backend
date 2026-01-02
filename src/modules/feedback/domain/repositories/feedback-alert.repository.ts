import { IRepository } from "src/core";
import { FeedbackAlertEntity } from "../entities/feedback-alert.entity";

export interface IFeedbackAlertRepository
  extends IRepository<FeedbackAlertEntity> {
  create(entity: FeedbackAlertEntity): Promise<FeedbackAlertEntity>;
  save(entity: FeedbackAlertEntity): Promise<FeedbackAlertEntity>;
  findByAlertId(
    alertId: string,
    subjectId: string
  ): Promise<FeedbackAlertEntity | null>;
  findBySubjectId(subjectId: string): Promise<FeedbackAlertEntity[]>;
}
