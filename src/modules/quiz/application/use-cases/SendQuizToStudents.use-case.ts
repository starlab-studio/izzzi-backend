import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  SendQuizToStudentsInput,
  SendQuizToStudentsOutput,
} from "../../domain/types";
import { IQuizRepository } from "../../domain/repositories/quiz.repository";
import { IStudentQuizTokenRepository } from "../../domain/repositories/student-quiz-token.repository";
import { ISubjectRepository } from "src/modules/subject/domain/repositories/subject.repository";
import { ISubjectAssignmentRepository } from "src/modules/subject/domain/repositories/subject-assignment.repository";
import { IClassStudentRepository } from "src/modules/class/domain/repositories/class-student.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { StudentQuizTokenEntity } from "../../domain/entities/student-quiz-token.entity";
import { CreateEmailNotificationUseCase } from "src/modules/notification/application/use-cases/create-email-notification.use-case";
import { GeneralUtils } from "src/utils/general.utils";
import { randomBytes } from "crypto";

export class SendQuizToStudentsUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly quizRepository: IQuizRepository,
    private readonly studentQuizTokenRepository: IStudentQuizTokenRepository,
    private readonly subjectRepository: ISubjectRepository,
    private readonly subjectAssignmentRepository: ISubjectAssignmentRepository,
    private readonly classStudentRepository: IClassStudentRepository,
    private readonly organizationFacade: OrganizationFacade,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase,
  ) {
    super(logger);
  }

  async execute(data: SendQuizToStudentsInput): Promise<SendQuizToStudentsOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      const quiz = await this.quizRepository.findById(data.quizId);
      if (!quiz) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Quiz not found");
      }

      const subject = await this.subjectRepository.findById(quiz.subjectId);
      if (!subject) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Subject not found");
      }

      if (subject.organizationId !== data.organizationId) {
        throw new DomainError(ErrorCode.UNAUTHORIZED_ACCESS, "Unauthorized access to quiz");
      }

      const assignments = await this.subjectAssignmentRepository.findBySubject(subject.id);
      const activeAssignment = assignments.find((a) => a.isActive);
      if (!activeAssignment) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Subject is not assigned to any class");
      }

      const students = await this.classStudentRepository.findByClassAndActive(
        activeAssignment.classId,
        true,
      );

      if (students.length === 0) {
        return {
          sentCount: 0,
          alreadySentCount: 0,
        };
      }

      let sentCount = 0;
      let alreadySentCount = 0;

      for (const student of students) {
        const existingTokens = await this.studentQuizTokenRepository.findByQuiz(data.quizId);
        const existingToken = existingTokens.find(
          (t) => t.classStudentId === student.id,
        );

        if (existingToken && existingToken.emailSentAt) {
          alreadySentCount++;
          continue;
        }

        const token = this.generateToken();

        let tokenEntity: StudentQuizTokenEntity;
        if (existingToken) {
          tokenEntity = existingToken;
        } else {
          tokenEntity = StudentQuizTokenEntity.create({
            quizId: data.quizId,
            classStudentId: student.id,
            token,
          });
          tokenEntity = await this.studentQuizTokenRepository.create(tokenEntity);
        }
        // Mark email as sent
        tokenEntity.markEmailSent();
        await this.studentQuizTokenRepository.save(tokenEntity);

        const studentUrl = quiz.publicUrl
          ? `${quiz.publicUrl}?token=${token}`
          : null;

        if (studentUrl) {
          try {
            const quizTypeLabel = quiz.type === "during_course" 
              ? "Pendant le cours" 
              : "Fin du cours";
            
            const template = GeneralUtils.htmlTemplateReader("quiz-send.html", {
              subjectName: subject.name,
              quizUrl: studentUrl,
              quizType: quizTypeLabel,
            });
            
            await this.createEmailNotificationUseCase.execute({
              target: student.email,
              subject: `Questionnaire de retour - ${subject.name}`,
              template,
            });
            sentCount++;
          } catch (error) {
            this.logger.error(`Failed to send email to ${student.email}:`, error);
          }
        }
      }

      return {
        sentCount,
        alreadySentCount,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  private generateToken(): string {
    return randomBytes(32).toString("hex");
  }

  async withCompensation(): Promise<void> {}
}

