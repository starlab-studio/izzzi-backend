import { IUseCase, BaseUseCase, ILoggerService } from "src/core";
import {
  CreateQuizTemplateInput,
  CreateQuizTemplateOutput,
} from "../../domain/types";
import { IQuizTemplateRepository } from "../../domain/repositories/quiz-template.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { QuizTemplateEntity } from "../../domain/entities/quiz-template.entity";
import { randomUUID } from "crypto";

export class CreateQuizTemplateUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly quizTemplateRepository: IQuizTemplateRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(
    data: CreateQuizTemplateInput,
  ): Promise<CreateQuizTemplateOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      const templateEntity = QuizTemplateEntity.create({
        type: data.type,
        name: data.name,
        description: data.description ?? null,
        previewImageUrl: data.previewImageUrl ?? null,
        displayOrder: 0,
      });

      const questions = data.questions.map((q) => ({
        id: randomUUID(),
        templateId: templateEntity.id,
        text: q.text,
        type: q.type,
        options: q.options,
        validationRules: q.validationRules,
        orderIndex: q.orderIndex,
        category: q.category,
        createdAt: new Date(),
      }));

      templateEntity.setQuestions(questions);

      const createdTemplate =
        await this.quizTemplateRepository.create(templateEntity);

      return {
        id: createdTemplate.id,
        name: createdTemplate.name,
        type: createdTemplate.type,
        description: createdTemplate.description,
        previewImageUrl: createdTemplate.previewImageUrl,
        questions: createdTemplate.questionsList.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options,
          validationRules: q.validationRules,
          orderIndex: q.orderIndex,
          category: q.category,
        })),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
