import { BaseUseCase, IUseCase, type ILoggerService } from "src/core";
import { AiClientService } from "../../../ai/application/services/ai-client.service";
import {
  GetFeedbackSummaryInput,
  GetFeedbackSummaryOutput,
} from "../../domain/types";

export class GetFeedbackSummaryUseCase
  extends BaseUseCase
  implements IUseCase<GetFeedbackSummaryInput, GetFeedbackSummaryOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly aiClientService: AiClientService
  ) {
    super(logger);
  }

  async execute(
    data: GetFeedbackSummaryInput
  ): Promise<GetFeedbackSummaryOutput> {
    try {
      this.logger.info(
        `Getting feedback summary for subject ${data.subjectId}`
      );

      const jwtToken = data.jwtToken || "";

      const result = await this.aiClientService.getFeedbackSummary(
        data.subjectId,
        30,
        jwtToken
      );

      return {
        summary: result.summary,
        fullSummary: result.full_summary,
      };
    } catch (error: any) {
      this.handleError(error);
      return {
        summary: "",
        fullSummary: "",
      };
    }
  }

  async withCompensation(): Promise<void> {
    // Pas de compensation nécessaire
  }
}
