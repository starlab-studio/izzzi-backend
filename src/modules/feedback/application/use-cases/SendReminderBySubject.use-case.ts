import { IUseCase, BaseUseCase, ILoggerService } from "src/core";
import {
  SendReminderBySubjectInput,
  SendReminderBySubjectOutput,
} from "../../domain/types";
import { QuizFacade } from "src/modules/quiz/application/facades/quiz.facade";

export class SendReminderBySubjectUseCase
  extends BaseUseCase
  implements IUseCase<SendReminderBySubjectInput, SendReminderBySubjectOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly quizFacade: QuizFacade
  ) {
    super(logger);
  }

  async execute(
    data: SendReminderBySubjectInput
  ): Promise<SendReminderBySubjectOutput> {
    try {
      const quizzesResult = await this.quizFacade.getQuizzesBySubject({
        organizationId: data.organizationId,
        userId: data.userId,
        subjectId: data.subjectId,
      });

      const activeQuizzes = quizzesResult.quizzes.filter(
        (q) => q.status === "active"
      );

      if (activeQuizzes.length === 0) {
        return {
          success: false,
          message: "Aucun quiz actif pour cette matière",
          totalQuizzes: 0,
          remindedCount: 0,
          newStudentsSentCount: 0,
          alreadyRespondedCount: 0,
        };
      }

      let totalReminded = 0;
      let totalNewStudents = 0;
      let totalAlreadyResponded = 0;
      const errors: string[] = [];

      for (const quiz of activeQuizzes) {
        try {
          const result = await this.quizFacade.remindQuizToStudents({
            organizationId: data.organizationId,
            userId: data.userId,
            quizId: quiz.id,
          });

          totalReminded += result.remindedCount;
          totalNewStudents += result.newStudentsSentCount;
          totalAlreadyResponded += result.alreadyRespondedCount;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          errors.push(`Erreur pour le quiz ${quiz.id}: ${errorMessage}`);
          this.logger.error(`Error reminding quiz ${quiz.id}:`, errorMessage);
        }
      }

      return {
        success: errors.length === 0,
        message:
          errors.length === 0
            ? `Rappels envoyés pour ${activeQuizzes.length} quiz(s)`
            : `Rappels envoyés avec ${errors.length} erreur(s)`,
        totalQuizzes: activeQuizzes.length,
        remindedCount: totalReminded,
        newStudentsSentCount: totalNewStudents,
        alreadyRespondedCount: totalAlreadyResponded,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
