import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  GetQuizByAccessTokenInput,
  GetQuizByAccessTokenOutput,
} from "../../domain/types";
import { IQuizRepository } from "../../domain/repositories/quiz.repository";
import { IQuizTemplateRepository } from "../../domain/repositories/quiz-template.repository";
import { ISubjectRepository } from "src/modules/subject/domain/repositories/subject.repository";
import { ISubjectAssignmentRepository } from "src/modules/subject/domain/repositories/subject-assignment.repository";
import { IClassRepository } from "src/modules/class/domain/repositories/class.repository";
import { IOrganizationRepository } from "src/modules/organization/domain/repositories/organization.repository";

export class GetQuizByAccessTokenUseCase
  extends BaseUseCase
  implements IUseCase
{
  constructor(
    readonly logger: ILoggerService,
    private readonly quizRepository: IQuizRepository,
    private readonly quizTemplateRepository: IQuizTemplateRepository,
    private readonly subjectRepository: ISubjectRepository,
    private readonly subjectAssignmentRepository: ISubjectAssignmentRepository,
    private readonly classRepository: IClassRepository,
    private readonly organizationRepository: IOrganizationRepository,
  ) {
    super(logger);
  }

  async execute(
    data: GetQuizByAccessTokenInput,
  ): Promise<GetQuizByAccessTokenOutput> {
    try {
      const quiz = await this.quizRepository.findByAccessToken(
        data.accessToken,
      );
      if (!quiz) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Quiz not found");
      }

      if (quiz.status === "closed") {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Quiz is closed");
      }

      const subject = await this.subjectRepository.findById(quiz.subjectId);
      if (!subject) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Subject not found");
      }

      const assignments = await this.subjectAssignmentRepository.findBySubject(
        subject.id,
      );
      const activeAssignment = assignments.find((a) => a.isActive);
      if (!activeAssignment) {
        throw new DomainError(
          ErrorCode.UNEXPECTED_ERROR,
          "Subject is not assigned to any class",
        );
      }

      const classEntity = await this.classRepository.findById(
        activeAssignment.classId,
      );
      if (!classEntity) {
        throw new DomainError(ErrorCode.CLASS_NOT_FOUND, "Class not found");
      }

      const organization = await this.organizationRepository.findById(
        classEntity.organizationId,
      );
      if (!organization) {
        throw new DomainError(
          ErrorCode.UNEXPECTED_ERROR,
          "Organization not found",
        );
      }

      const template = await this.quizTemplateRepository.findById(
        quiz.templateId,
      );
      if (!template) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Template not found");
      }

      return {
        id: quiz.id,
        type: quiz.type,
        status: quiz.status,
        subject: {
          id: subject.id,
          name: subject.name,
          class: {
            id: classEntity.id,
            name: classEntity.name,
          },
          organization: {
            id: organization.id,
            name: organization.name,
          },
        },
        template: {
          id: template.id,
          name: template.name,
          questions: template.questionsList.map((q) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options,
            validationRules: q.validationRules,
            orderIndex: q.orderIndex,
            category: q.category,
          })),
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
