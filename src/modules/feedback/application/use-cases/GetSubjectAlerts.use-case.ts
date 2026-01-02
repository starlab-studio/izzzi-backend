import { BaseUseCase, IUseCase, type ILoggerService } from "src/core";
import { AiClientService } from "../../../ai/application/services/ai-client.service";
import {
  GetFeedbackAlertsInput,
  GetFeedbackAlertsOutput,
} from "../../domain/types";
import { IFeedbackAlertRepository } from "../../domain/repositories/feedback-alert.repository";

export class GetSubjectAlertsUseCase
  extends BaseUseCase
  implements IUseCase<GetFeedbackAlertsInput, GetFeedbackAlertsOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly aiClientService: AiClientService,
    private readonly feedbackAlertRepository: IFeedbackAlertRepository
  ) {
    super(logger);
  }

  async execute(
    data: GetFeedbackAlertsInput
  ): Promise<GetFeedbackAlertsOutput> {
    try {
      this.logger.info(`Getting alerts for subject ${data.subjectId}`);

      const jwtToken = data.jwtToken || "";

      const result = await this.aiClientService.getFeedbackAlerts(
        data.subjectId,
        30,
        jwtToken
      );

      const alertStatuses = await this.feedbackAlertRepository.findBySubjectId(
        data.subjectId
      );

      const statusMap = new Map<string, boolean>();
      alertStatuses.forEach((status) => {
        statusMap.set(status.alertId, status.isProcessed);
      });

      const alertsWithStatus = result.alerts.map((alert) => ({
        ...alert,
        isProcessed: statusMap.get(alert.id) || false,
      }));

      return {
        alerts: alertsWithStatus,
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
