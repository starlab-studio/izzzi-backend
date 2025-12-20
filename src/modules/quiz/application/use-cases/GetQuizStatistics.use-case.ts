import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  GetQuizStatisticsInput,
  GetQuizStatisticsOutput,
  QuestionStatistics,
  TemporalDataPoint,
} from "../../domain/types";
import { IQuizRepository } from "../../domain/repositories/quiz.repository";
import { IQuizTemplateRepository } from "../../domain/repositories/quiz-template.repository";
import { IResponseRepository } from "../../domain/repositories/response.repository";
import { IAnswerRepository } from "../../domain/repositories/answer.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export class GetQuizStatisticsUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly quizRepository: IQuizRepository,
    private readonly quizTemplateRepository: IQuizTemplateRepository,
    private readonly responseRepository: IResponseRepository,
    private readonly answerRepository: IAnswerRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(
    data: GetQuizStatisticsInput,
  ): Promise<GetQuizStatisticsOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      const quiz = await this.quizRepository.findById(data.quizId);
      if (!quiz) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Quiz not found");
      }

      // Get all responses for this quiz
      const responses = await this.responseRepository.findByQuiz(data.quizId);

      // Get all answers for this quiz
      const allAnswers = await this.answerRepository.findByQuiz(data.quizId);

      // Get template with questions
      const template = await this.quizTemplateRepository.findById(
        quiz.templateId,
      );
      if (!template) {
        throw new DomainError(
          ErrorCode.UNEXPECTED_ERROR,
          "Template not found",
        );
      }

      // Calculate statistics for each question
      const questionsStats: QuestionStatistics[] = template.questionsList.map(
        (question) => {
          const questionAnswers = allAnswers.filter(
            (answer) => answer.questionId === question.id,
          );

          const stats: QuestionStatistics = {
            questionId: question.id,
            questionText: question.text,
            questionType: question.type,
            orderIndex: question.orderIndex,
            category: question.category,
            totalResponses: questionAnswers.length,
          };

          if (question.type === "stars") {
            const starsValues = questionAnswers
              .map((a) => a.valueStars)
              .filter((v): v is number => v !== null);
            if (starsValues.length > 0) {
              stats.starsAverage =
                starsValues.reduce((sum, val) => sum + val, 0) /
                starsValues.length;
              stats.starsDistribution = starsValues.reduce(
                (acc, val) => {
                  acc[val] = (acc[val] || 0) + 1;
                  return acc;
                },
                {} as Record<number, number>,
              );
            }
          } else if (question.type === "radio") {
            const radioValues = questionAnswers
              .map((a) => a.valueRadio)
              .filter((v): v is string => v !== null);
            stats.optionsDistribution = radioValues.reduce(
              (acc, val) => {
                acc[val] = (acc[val] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>,
            );
          } else if (question.type === "checkbox") {
            const checkboxValues = questionAnswers
              .map((a) => a.valueCheckbox)
              .filter((v): v is string[] => v !== null && Array.isArray(v));
            stats.optionsDistribution = checkboxValues
              .flat()
              .reduce(
                (acc, val) => {
                  acc[val] = (acc[val] || 0) + 1;
                  return acc;
                },
                {} as Record<string, number>,
              );
          } else if (question.type === "textarea") {
            const textValues = questionAnswers
              .map((a) => a.valueText)
              .filter((v): v is string => v !== null && v.trim() !== "");
            stats.textResponses = textValues;
          }

          return stats;
        },
      );

      // Calculate temporal evolution
      const temporalMap = new Map<string, { count: number; starsSum: number; starsCount: number }>();
      
      responses.forEach((response) => {
        const dateKey = response.submittedAt.toISOString().split("T")[0]; // YYYY-MM-DD
        const existing = temporalMap.get(dateKey) || { count: 0, starsSum: 0, starsCount: 0 };
        existing.count += 1;

        // Get average stars for this response (first stars question answer)
        const responseAnswers = allAnswers.filter((a) => a.responseId === response.id);
        const starsAnswer = responseAnswers.find((a) => {
          const q = template.questionsList.find((q) => q.id === a.questionId);
          return q?.type === "stars" && a.valueStars !== null;
        });
        if (starsAnswer && starsAnswer.valueStars !== null && starsAnswer.valueStars !== undefined) {
          existing.starsSum += starsAnswer.valueStars;
          existing.starsCount += 1;
        }

        temporalMap.set(dateKey, existing);
      });

      const temporalEvolution: TemporalDataPoint[] = Array.from(
        temporalMap.entries(),
      )
        .map(([date, data]) => ({
          date,
          count: data.count,
          averageStars:
            data.starsCount > 0 ? data.starsSum / data.starsCount : undefined,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        quizId: quiz.id,
        totalResponses: responses.length,
        questions: questionsStats.sort((a, b) => a.orderIndex - b.orderIndex),
        temporalEvolution,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

