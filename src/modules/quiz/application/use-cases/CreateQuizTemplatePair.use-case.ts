import { Injectable } from "@nestjs/common";
import { BaseUseCase, IUseCase } from "src/core";
import type { ILoggerService } from "src/core";
import type { IQuizTemplateRepository } from "../../domain/repositories/quiz-template.repository";
import type { IQuizTemplatePairRepository } from "../../domain/repositories/quiz-template-pair.repository";
import { QuizTemplateEntity } from "../../domain/entities/quiz-template.entity";
import { QuizTemplatePairEntity } from "../../domain/entities/quiz-template-pair.entity";
import type { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { randomUUID } from "crypto";

export interface CreateQuizTemplatePairInput {
  organizationId: string;
  userId: string;
  name: string;
  description?: string;
  duringCourseTemplate: {
    name: string;
    description?: string;
    questions: Array<{
      text: string;
      type: "stars" | "radio" | "checkbox" | "textarea";
      options?: string[];
      category: "global" | "course" | "instructor";
      orderIndex: number;
    }>;
  };
  afterCourseTemplate: {
    name: string;
    description?: string;
    questions: Array<{
      text: string;
      type: "stars" | "radio" | "checkbox" | "textarea";
      options?: string[];
      category: "global" | "course" | "instructor";
      orderIndex: number;
    }>;
  };
}

export interface CreateQuizTemplatePairOutput {
  id: string;
  name: string;
  description: string | null;
  duringCourseTemplateId: string;
  afterCourseTemplateId: string;
}

@Injectable()
export class CreateQuizTemplatePairUseCase
  extends BaseUseCase
  implements IUseCase
{
  constructor(
    readonly logger: ILoggerService,
    private readonly templateRepository: IQuizTemplateRepository,
    private readonly templatePairRepository: IQuizTemplatePairRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(
    data: CreateQuizTemplatePairInput,
  ): Promise<CreateQuizTemplatePairOutput> {
    try {
      // Validate user belongs to organization
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      // Create during course template
      const duringTemplate = QuizTemplateEntity.create({
        type: "during_course",
        name: data.duringCourseTemplate.name,
        description: data.duringCourseTemplate.description || null,
        displayOrder: 999,
      });

      const duringQuestions = data.duringCourseTemplate.questions.map((q) => ({
        id: randomUUID(),
        templateId: duringTemplate.id,
        text: q.text,
        type: q.type,
        options: q.options || null,
        validationRules: null,
        orderIndex: q.orderIndex,
        category: q.category,
        createdAt: new Date(),
      }));

      duringTemplate.setQuestions(duringQuestions);

      // Create after course template
      const afterTemplate = QuizTemplateEntity.create({
        type: "after_course",
        name: data.afterCourseTemplate.name,
        description: data.afterCourseTemplate.description || null,
        displayOrder: 999,
      });

      const afterQuestions = data.afterCourseTemplate.questions.map((q) => ({
        id: randomUUID(),
        templateId: afterTemplate.id,
        text: q.text,
        type: q.type,
        options: q.options || null,
        validationRules: null,
        orderIndex: q.orderIndex,
        category: q.category,
        createdAt: new Date(),
      }));

      afterTemplate.setQuestions(afterQuestions);

      // Save templates with their questions
      const savedDuringTemplate =
        await this.templateRepository.create(duringTemplate);
      const savedAfterTemplate =
        await this.templateRepository.create(afterTemplate);

      // Create template pair
      const pairId = randomUUID();
      const templatePair = QuizTemplatePairEntity.reconstitute({
        id: pairId,
        name: data.name,
        description: data.description || null,
        duringCourseTemplateId: savedDuringTemplate.id,
        afterCourseTemplateId: savedAfterTemplate.id,
        isActive: true,
        displayOrder: 999, // Custom pairs at the end
        createdAt: new Date(),
      });

      await this.templatePairRepository.save(templatePair);

      return {
        id: pairId,
        name: data.name,
        description: data.description || null,
        duringCourseTemplateId: savedDuringTemplate.id,
        afterCourseTemplateId: savedAfterTemplate.id,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
