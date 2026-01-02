import {
  BaseUseCase,
  IUseCase,
  type ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import { IFeedbackAlertRepository } from "../../domain/repositories/feedback-alert.repository";
import { FeedbackAlertEntity } from "../../domain/entities/feedback-alert.entity";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export interface MarkAlertAsProcessedInput {
  organizationId: string;
  userId: string;
  subjectId: string;
  alertId: string;
  processed: boolean;
}

export interface MarkAlertAsProcessedOutput {
  success: boolean;
}

export class MarkAlertAsProcessedUseCase
  extends BaseUseCase
  implements IUseCase<MarkAlertAsProcessedInput, MarkAlertAsProcessedOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly feedbackAlertRepository: IFeedbackAlertRepository,
    private readonly organizationFacade: OrganizationFacade
  ) {
    super(logger);
  }

  async execute(
    data: MarkAlertAsProcessedInput
  ): Promise<MarkAlertAsProcessedOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId
      );

      this.logger.info(
        `Marking alert ${data.alertId} as ${data.processed ? "processed" : "unprocessed"} for subject ${data.subjectId}`
      );

      let alertEntity = await this.feedbackAlertRepository.findByAlertId(
        data.alertId,
        data.subjectId
      );

      if (!alertEntity) {
        // Créer l'entité si elle n'existe pas
        alertEntity = FeedbackAlertEntity.create({
          alertId: data.alertId,
          subjectId: data.subjectId,
          organizationId: data.organizationId,
        });
        alertEntity = await this.feedbackAlertRepository.create(alertEntity);
      } else {
        if (alertEntity.organizationId !== data.organizationId) {
          throw new DomainError(
            ErrorCode.UNAUTHORIZED_ACCESS,
            "Unauthorized access to alert"
          );
        }
      }

      if (data.processed) {
        alertEntity.markAsProcessed(data.userId);
      } else {
        alertEntity.markAsUnprocessed();
      }

      await this.feedbackAlertRepository.save(alertEntity);

      return {
        success: true,
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
