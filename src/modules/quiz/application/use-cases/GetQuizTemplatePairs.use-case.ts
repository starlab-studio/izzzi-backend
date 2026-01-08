import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  GetQuizTemplatePairsInput,
  GetQuizTemplatePairsOutput,
  QuizTemplatePairResponse,
} from "../../domain/types";
import { IQuizTemplatePairRepository } from "../../domain/repositories/quiz-template-pair.repository";
import { IQuizTemplateRepository } from "../../domain/repositories/quiz-template.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export class GetQuizTemplatePairsUseCase
  extends BaseUseCase
  implements IUseCase
{
  constructor(
    readonly logger: ILoggerService,
    private readonly quizTemplatePairRepository: IQuizTemplatePairRepository,
    private readonly quizTemplateRepository: IQuizTemplateRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(
    data: GetQuizTemplatePairsInput,
  ): Promise<GetQuizTemplatePairsOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      const pairs = await this.quizTemplatePairRepository.findAllActive();

      const templateIds = pairs.flatMap((pair) => [
        pair.duringCourseTemplateId,
        pair.afterCourseTemplateId,
      ]);

      const templates =
        await this.quizTemplateRepository.findByIds(templateIds);

      const templateMap = new Map(templates.map((t) => [t.id, t]));

      const pairsResponse: QuizTemplatePairResponse[] = pairs.map((pair) => {
        const duringTemplate = templateMap.get(pair.duringCourseTemplateId);
        const afterTemplate = templateMap.get(pair.afterCourseTemplateId);

        if (!duringTemplate || !afterTemplate) {
          throw new DomainError(
            ErrorCode.UNEXPECTED_ERROR,
            `Template not found for pair ${pair.id}`,
          );
        }

        return {
          id: pair.id,
          name: pair.name,
          description: pair.description,
          duringCourse: {
            id: duringTemplate.id,
            name: duringTemplate.name,
            type: "during_course" as const,
            previewImageUrl: duringTemplate.previewImageUrl,
            questionsCount: duringTemplate.questionsList.length,
          },
          afterCourse: {
            id: afterTemplate.id,
            name: afterTemplate.name,
            type: "after_course" as const,
            previewImageUrl: afterTemplate.previewImageUrl,
            questionsCount: afterTemplate.questionsList.length,
          },
        };
      });

      return { pairs: pairsResponse };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
