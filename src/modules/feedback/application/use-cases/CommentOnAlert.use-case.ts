import { BaseUseCase, IUseCase, type ILoggerService } from "src/core";
import { IAlertCommentRepository } from "../../domain/repositories/alert-comment.repository";
import { AlertCommentEntity } from "../../domain/entities/alert-comment.entity";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export interface CommentOnAlertInput {
  organizationId: string;
  userId: string;
  subjectId: string;
  alertId: string;
  comment: string;
}

export interface CommentOnAlertOutput {
  success: boolean;
}

export class CommentOnAlertUseCase
  extends BaseUseCase
  implements IUseCase<CommentOnAlertInput, CommentOnAlertOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly alertCommentRepository: IAlertCommentRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(data: CommentOnAlertInput): Promise<CommentOnAlertOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      this.logger.info(
        `Adding comment to alert ${data.alertId} for subject ${data.subjectId}`,
      );

      const commentEntity = AlertCommentEntity.create({
        alertId: data.alertId,
        subjectId: data.subjectId,
        organizationId: data.organizationId,
        userId: data.userId,
        comment: data.comment,
      });

      await this.alertCommentRepository.create(commentEntity);

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
