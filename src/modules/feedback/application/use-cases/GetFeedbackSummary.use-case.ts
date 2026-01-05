import { BaseUseCase, IUseCase, type ILoggerService } from "src/core";
import {
  GetFeedbackSummaryInput,
  GetFeedbackSummaryOutput,
} from "../../domain/types";
import { ISubjectSummaryRepository } from "../../domain/repositories/subject-summary.repository";

export class GetFeedbackSummaryUseCase
  extends BaseUseCase
  implements IUseCase<GetFeedbackSummaryInput, GetFeedbackSummaryOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly subjectSummaryRepository: ISubjectSummaryRepository
  ) {
    super(logger);
  }

  async execute(
    data: GetFeedbackSummaryInput
  ): Promise<GetFeedbackSummaryOutput> {
    try {
      this.logger.info(
        `Getting feedback summary for subject ${data.subjectId}, formType: ${data.formType || "not specified"}`
      );

      const periodDays = data.periodDays || 30;

      // If formType is not provided, return empty summary
      if (!data.formType) {
        this.logger.warn(
          `FormType not provided for subject ${data.subjectId}, returning empty summary`
        );
        return {
          summary: "",
          fullSummary: "",
        };
      }

      // Retrieve summary from database
      const summaryEntity =
        await this.subjectSummaryRepository.findBySubjectIdAndFormType(
          data.subjectId,
          periodDays,
          data.formType
        );

      if (!summaryEntity) {
        this.logger.info(
          `No summary found in database for subject ${data.subjectId}, formType: ${data.formType}`
        );
        return {
          summary: "",
          fullSummary: "",
        };
      }

      return {
        summary: summaryEntity.summary,
        fullSummary: summaryEntity.fullSummary,
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
