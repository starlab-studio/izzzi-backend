import {
  BaseUseCase,
  IUseCase,
  type ILoggerService,
  IEventStore,
} from "src/core";
import { ReportGeneratedEvent } from "../../domain/events/report-generated.event";
import { CreateReportInput, CreateReportOutput } from "../../domain/types";

export class CreateReportUseCase
  extends BaseUseCase
  implements IUseCase<CreateReportInput, CreateReportOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly eventStore: IEventStore
  ) {
    super(logger);
  }

  async execute(data: CreateReportInput): Promise<CreateReportOutput> {
    try {
      this.logger.info(
        `Creating report for organization ${data.organizationId}`
      );

      const event = new ReportGeneratedEvent({
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        reportContent: data.reportContent,
        subjectIds: data.subjectIds,
        generatedAt: new Date().toISOString(),
      });

      await this.eventStore.publish(event);

      this.logger.info(
        `Report event published for organization ${data.organizationId}`
      );

      return {
        success: true,
        message: "Report generated and notifications sent",
      };
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async withCompensation(): Promise<void> {
    // Pas de compensation nécessaire
  }
}
