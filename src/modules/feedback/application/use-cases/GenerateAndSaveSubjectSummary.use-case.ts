import { BaseUseCase, IUseCase, type ILoggerService } from "src/core";
import { AiClientService } from "src/modules/ai/application/services/ai-client.service";
import { ISubjectSummaryRepository } from "../../domain/repositories/subject-summary.repository";
import { SubjectSummaryEntity } from "../../domain/entities/subject-summary.entity";
import { IQuizRepository } from "src/modules/quiz/domain/repositories/quiz.repository";
import { IResponseRepository } from "src/modules/quiz/domain/repositories/response.repository";

export interface GenerateAndSaveSubjectSummaryInput {
  organizationId: string;
  userId: string;
  subjectId: string;
  formType: "during_course" | "after_course";
  periodDays?: number;
  jwtToken: string;
}

export interface GenerateAndSaveSubjectSummaryOutput {
  summary: string;
  fullSummary?: string;
  generatedAt: string;
  feedbackCountAtGeneration: number;
}

export class GenerateAndSaveSubjectSummaryUseCase
  extends BaseUseCase
  implements
    IUseCase<
      GenerateAndSaveSubjectSummaryInput,
      GenerateAndSaveSubjectSummaryOutput
    >
{
  constructor(
    readonly logger: ILoggerService,
    private readonly aiClientService: AiClientService,
    private readonly subjectSummaryRepository: ISubjectSummaryRepository,
    private readonly quizRepository: IQuizRepository,
    private readonly responseRepository: IResponseRepository
  ) {
    super(logger);
  }

  async execute(
    data: GenerateAndSaveSubjectSummaryInput
  ): Promise<GenerateAndSaveSubjectSummaryOutput> {
    try {
      const periodDays = data.periodDays || 30;

      this.logger.info(
        `Generating and saving summary for subject ${data.subjectId}, formType ${data.formType} (period: ${periodDays} days)`
      );

      // 1. Call Langchain service to generate summary
      const aiResponse = await this.aiClientService.getFeedbackSummary(
        data.subjectId,
        periodDays,
        data.jwtToken
      );

      // 2. Count current feedbacks for this subject by counting responses only for quizzes of the specified formType
      const quizzes = await this.quizRepository.findBySubject(data.subjectId);
      const quizzesForFormType = quizzes.filter(
        (quiz) => quiz.toPersistence().type === data.formType
      );

      let feedbackCount = 0;
      for (const quiz of quizzesForFormType) {
        const responses = await this.responseRepository.findByQuiz(quiz.id);
        feedbackCount += responses.length;
      }

      // 3. Extract sentiment score if present (stored but not displayed)
      // The AI service doesn't return this yet, so we set it to undefined
      const sentimentScore = undefined;

      // 4. Create or update the summary entity
      const summaryEntity = SubjectSummaryEntity.create({
        subjectId: data.subjectId,
        organizationId: data.organizationId,
        summary: aiResponse.summary,
        fullSummary: aiResponse.full_summary,
        sentimentScore: sentimentScore,
        periodDays: periodDays,
        formType: data.formType,
        feedbackCountAtGeneration: feedbackCount,
        generatedAt: new Date(aiResponse.generated_at),
      });

      // 5. Save to database (upsert: insert if new, update if exists)
      const savedSummary =
        await this.subjectSummaryRepository.upsert(summaryEntity);

      this.logger.info(
        `Summary saved successfully for subject ${data.subjectId} (${feedbackCount} feedbacks)`
      );

      return {
        summary: savedSummary.summary,
        fullSummary: savedSummary.fullSummary,
        generatedAt: savedSummary.generatedAt.toISOString(),
        feedbackCountAtGeneration: savedSummary.feedbackCountAtGeneration,
      };
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async withCompensation(): Promise<void> {
    // No compensation needed
  }
}
