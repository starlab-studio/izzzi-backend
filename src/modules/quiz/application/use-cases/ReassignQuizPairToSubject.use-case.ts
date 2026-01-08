import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  ReassignQuizPairToSubjectInput,
  ReassignQuizPairToSubjectOutput,
} from "../../domain/types";
import { IQuizTemplatePairRepository } from "../../domain/repositories/quiz-template-pair.repository";
import { IQuizRepository } from "../../domain/repositories/quiz.repository";
import { IResponseRepository } from "../../domain/repositories/response.repository";
import { ISubjectRepository } from "src/modules/subject/domain/repositories/subject.repository";
import { ISubjectAssignmentRepository } from "src/modules/subject/domain/repositories/subject-assignment.repository";
import { IClassRepository } from "src/modules/class/domain/repositories/class.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { QuizEntity } from "../../domain/entities/quiz.entity";
import { randomBytes } from "crypto";

export class ReassignQuizPairToSubjectUseCase
  extends BaseUseCase
  implements IUseCase
{
  constructor(
    readonly logger: ILoggerService,
    private readonly quizTemplatePairRepository: IQuizTemplatePairRepository,
    private readonly quizRepository: IQuizRepository,
    private readonly responseRepository: IResponseRepository,
    private readonly subjectRepository: ISubjectRepository,
    private readonly subjectAssignmentRepository: ISubjectAssignmentRepository,
    private readonly classRepository: IClassRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(
    data: ReassignQuizPairToSubjectInput,
  ): Promise<ReassignQuizPairToSubjectOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      const subjectEntity = await this.subjectRepository.findById(
        data.subjectId,
      );
      if (!subjectEntity) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Subject not found");
      }

      if (subjectEntity.organizationId !== data.organizationId) {
        throw new DomainError(
          ErrorCode.UNAUTHORIZED_ACCESS,
          "Unauthorized access to subject",
        );
      }

      const assignments = await this.subjectAssignmentRepository.findBySubject(
        subjectEntity.id,
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

      const existingQuizzes = await this.quizRepository.findBySubject(
        data.subjectId,
      );
      if (existingQuizzes.length === 0) {
        throw new DomainError(
          ErrorCode.UNEXPECTED_ERROR,
          "No quizzes found for this subject. Use assign instead.",
        );
      }

      const duringQuiz = existingQuizzes.find(
        (q) => q.type === "during_course",
      );
      if (!duringQuiz) {
        throw new DomainError(
          ErrorCode.UNEXPECTED_ERROR,
          "During course quiz not found",
        );
      }

      const responseCount = await this.responseRepository.countByQuiz(
        duringQuiz.id,
      );
      if (responseCount > 0) {
        throw new DomainError(
          ErrorCode.UNEXPECTED_ERROR,
          "Cannot modify quiz pair: responses have already been recorded for the during_course quiz",
        );
      }

      const templatePair = await this.quizTemplatePairRepository.findById(
        data.templatePairId,
      );
      if (!templatePair) {
        throw new DomainError(
          ErrorCode.UNEXPECTED_ERROR,
          "Template pair not found",
        );
      }

      for (const quiz of existingQuizzes) {
        await this.quizRepository.delete(quiz.id);
      }

      const duringToken = this.generateAccessToken();
      const afterToken = this.generateAccessToken();

      const baseUrl = process.env.FRONTEND_URL || "http://localhost:3001";
      const duringPublicUrl = `${baseUrl}/quiz/${duringToken}`;
      const afterPublicUrl = `${baseUrl}/quiz/${afterToken}`;

      const newDuringQuiz = QuizEntity.create({
        subjectId: data.subjectId,
        templateId: templatePair.duringCourseTemplateId,
        type: "during_course",
        accessToken: duringToken,
        publicUrl: duringPublicUrl,
        qrCodeUrl: null,
      });
      newDuringQuiz.activate();

      const newAfterQuiz = QuizEntity.create({
        subjectId: data.subjectId,
        templateId: templatePair.afterCourseTemplateId,
        type: "after_course",
        accessToken: afterToken,
        publicUrl: afterPublicUrl,
        qrCodeUrl: null,
      });
      newAfterQuiz.activate();

      const savedDuringQuiz = await this.quizRepository.create(newDuringQuiz);
      const savedAfterQuiz = await this.quizRepository.create(newAfterQuiz);

      return {
        duringCourse: {
          id: savedDuringQuiz.id,
          type: savedDuringQuiz.type,
          status: savedDuringQuiz.status,
          accessToken: savedDuringQuiz.accessToken,
          publicUrl: savedDuringQuiz.publicUrl,
          qrCodeUrl: savedDuringQuiz.qrCodeUrl,
          template: {
            id: templatePair.duringCourseTemplateId,
            name: "Template",
          },
        },
        afterCourse: {
          id: savedAfterQuiz.id,
          type: savedAfterQuiz.type,
          status: savedAfterQuiz.status,
          accessToken: savedAfterQuiz.accessToken,
          publicUrl: savedAfterQuiz.publicUrl,
          qrCodeUrl: savedAfterQuiz.qrCodeUrl,
          template: {
            id: templatePair.afterCourseTemplateId,
            name: "Template",
          },
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  private generateAccessToken(): string {
    return randomBytes(32).toString("hex");
  }

  async withCompensation(): Promise<void> {}
}
