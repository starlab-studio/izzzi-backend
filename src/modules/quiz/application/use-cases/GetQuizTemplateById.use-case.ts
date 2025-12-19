import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  GetQuizTemplateByIdInput,
  GetQuizTemplateByIdOutput,
  QuizTemplateQuestionResponse,
} from "../../domain/types";
import { IQuizTemplateRepository } from "../../domain/repositories/quiz-template.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export class GetQuizTemplateByIdUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly quizTemplateRepository: IQuizTemplateRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(data: GetQuizTemplateByIdInput): Promise<GetQuizTemplateByIdOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      const template = await this.quizTemplateRepository.findById(data.templateId);
      if (!template) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Template not found");
      }

      const questions: QuizTemplateQuestionResponse[] = template.questionsList.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
        validationRules: q.validationRules,
        orderIndex: q.orderIndex,
      }));

      return {
        id: template.id,
        name: template.name,
        type: template.type,
        description: template.description,
        previewImageUrl: template.previewImageUrl,
        questions,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

