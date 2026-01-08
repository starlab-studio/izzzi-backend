import { BaseUseCase, IUseCase, type ILoggerService } from "src/core";
import { IAlertCommentRepository } from "../../domain/repositories/alert-comment.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export interface GetAlertCommentsInput {
  organizationId: string;
  userId: string;
  subjectId: string;
  alertId: string;
}

export interface AlertCommentOutput {
  id: string;
  alertId: string;
  subjectId: string;
  organizationId: string;
  userId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetAlertCommentsOutput {
  comments: AlertCommentOutput[];
}

export class GetAlertCommentsUseCase
  extends BaseUseCase
  implements IUseCase<GetAlertCommentsInput, GetAlertCommentsOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly alertCommentRepository: IAlertCommentRepository,
    private readonly organizationFacade: OrganizationFacade
  ) {
    super(logger);
  }

  async execute(data: GetAlertCommentsInput): Promise<GetAlertCommentsOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId
      );

      this.logger.info(
        `Getting comments for alert ${data.alertId} for subject ${data.subjectId}`
      );

      const commentEntities = await this.alertCommentRepository.findByAlertId(
        data.alertId,
        data.subjectId
      );

      const comments: AlertCommentOutput[] = commentEntities.map((comment) => ({
        id: comment.id,
        alertId: comment.alertId,
        subjectId: comment.subjectId,
        organizationId: comment.organizationId,
        userId: comment.userId,
        comment: comment.comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      }));

      return {
        comments,
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
