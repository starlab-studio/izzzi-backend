import { BaseUseCase, IUseCase, type ILoggerService } from "src/core";
import {
  GetFeedbackAlertsInput,
  GetFeedbackAlertsOutput,
  FeedbackAlert,
} from "../../domain/types";
import { IFeedbackAlertRepository } from "../../domain/repositories/feedback-alert.repository";

export class GetSubjectAlertsUseCase
  extends BaseUseCase
  implements IUseCase<GetFeedbackAlertsInput, GetFeedbackAlertsOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly feedbackAlertRepository: IFeedbackAlertRepository
  ) {
    super(logger);
  }

  async execute(
    data: GetFeedbackAlertsInput
  ): Promise<GetFeedbackAlertsOutput> {
    try {
      this.logger.info(`Getting alerts for subject ${data.subjectId}`);

      const alertEntities = await this.feedbackAlertRepository.findBySubjectId(
        data.subjectId
      );

      const alerts: FeedbackAlert[] = alertEntities.map((alert) => ({
        id: alert.alertId,
        type: alert.type === "negative" ? "negative" : "positive",
        number: alert.number,
        content: alert.content,
        timestamp: alert.timestamp.toISOString(),
        isProcessed: alert.isProcessed,
      }));

      return {
        alerts,
      };
    } catch (error: any) {
      this.handleError(error);
      return {
        alerts: [],
      };
    }
  }

  async withCompensation(): Promise<void> {
    // Pas de compensation nécessaire
  }
}
