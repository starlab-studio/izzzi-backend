import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  RemindQuizToStudentsInput,
  RemindQuizToStudentsOutput,
} from "../../domain/types";
import { IQuizRepository } from "../../domain/repositories/quiz.repository";
import { IStudentQuizTokenRepository } from "../../domain/repositories/student-quiz-token.repository";
import { ISubjectRepository } from "src/modules/subject/domain/repositories/subject.repository";
import { ISubjectAssignmentRepository } from "src/modules/subject/domain/repositories/subject-assignment.repository";
import { IClassStudentRepository } from "src/modules/class/domain/repositories/class-student.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { CreateEmailNotificationUseCase } from "src/modules/notification/application/use-cases/create-email-notification.use-case";
import { GeneralUtils } from "src/utils/general.utils";
import { StudentQuizTokenEntity } from "../../domain/entities/student-quiz-token.entity";
import { randomBytes } from "crypto";

export class RemindQuizToStudentsUseCase
  extends BaseUseCase
  implements IUseCase
{
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

  async execute(
    data: RemindQuizToStudentsInput,
  ): Promise<RemindQuizToStudentsOutput> {
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
        throw new DomainError(
          ErrorCode.UNAUTHORIZED_ACCESS,
          "Unauthorized access to quiz",
        );
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

      const allTokens = await this.studentQuizTokenRepository.findByQuiz(
        data.quizId,
      );
      const students = await this.classStudentRepository.findByClassAndActive(
        activeAssignment.classId,
        true,
      );
      const studentMap = new Map(students.map((s) => [s.id, s]));
      const tokenStudentIds = new Set(allTokens.map((t) => t.classStudentId));

      const newStudents = students.filter((s) => !tokenStudentIds.has(s.id));

      if (allTokens.length === 0 && newStudents.length === 0) {
        return {
          remindedCount: 0,
          newStudentsSentCount: 0,
          alreadyRespondedCount: 0,
          message:
            "Aucun étudiant n'a encore reçu ce questionnaire. Veuillez d'abord l'envoyer aux étudiants.",
        };
      }

      const tokensToRemind = allTokens.filter((t) => !t.hasResponded);
      const respondedCount = allTokens.filter((t) => t.hasResponded).length;

      if (tokensToRemind.length === 0 && newStudents.length === 0) {
        return {
          remindedCount: 0,
          newStudentsSentCount: 0,
          alreadyRespondedCount: respondedCount,
          message: "Tous les étudiants ont déjà répondu à ce questionnaire.",
        };
      }

      let newStudentsSentCount = 0;
      let remindedCount = 0;

      for (const student of newStudents) {
        const token = this.generateToken();
        const tokenEntity = StudentQuizTokenEntity.create({
          quizId: data.quizId,
          classStudentId: student.id,
          token,
        });
        tokenEntity.markEmailSent();
        await this.studentQuizTokenRepository.create(tokenEntity);

        const studentUrl = quiz.publicUrl
          ? `${quiz.publicUrl}?token=${token}`
          : null;

        if (studentUrl) {
          try {
            const quizTypeLabel =
              quiz.type === "during_course"
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
            newStudentsSentCount++;
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            this.logger.error(
              `Failed to send email to new student ${student.email}:`,
              errorMessage,
            );
          }
        }
      }

      for (const token of tokensToRemind) {
        const student = studentMap.get(token.classStudentId);
        if (!student) continue;

        token.incrementReminderCount();
        await this.studentQuizTokenRepository.save(token);

        const studentUrl = quiz.publicUrl
          ? `${quiz.publicUrl}?token=${token.token}`
          : null;

        if (studentUrl) {
          try {
            const quizTypeLabel =
              quiz.type === "during_course"
                ? "Pendant le cours"
                : "Fin du cours";

            const template = GeneralUtils.htmlTemplateReader(
              "quiz-remind.html",
              {
                subjectName: subject.name,
                quizUrl: studentUrl,
                quizType: quizTypeLabel,
              },
            );

            await this.createEmailNotificationUseCase.execute({
              target: student.email,
              subject: `Rappel - Questionnaire de retour - ${subject.name}`,
              template,
            });
            remindedCount++;
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            this.logger.error(
              `Failed to send reminder to ${student.email}:`,
              errorMessage,
            );
          }
        }
      }

      const alreadyRespondedCount = allTokens.filter(
        (t) => t.hasResponded,
      ).length;

      return {
        remindedCount,
        newStudentsSentCount,
        alreadyRespondedCount,
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
