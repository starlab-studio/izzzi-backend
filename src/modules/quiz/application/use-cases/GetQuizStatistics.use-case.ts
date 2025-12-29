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
import { ISubjectRepository } from "src/modules/subject/domain/repositories/subject.repository";
import { ISubjectAssignmentRepository } from "src/modules/subject/domain/repositories/subject-assignment.repository";
import { IClassRepository } from "src/modules/class/domain/repositories/class.repository";
import { IOrganizationRepository } from "src/modules/organization/domain/repositories/organization.repository";
import { ResponseVisibilityService } from "../../domain/services/response-visibility.service";
import { SubscriptionFeatureService } from "src/modules/subscription/domain/services/subscription-feature.service";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { ResponseEntity } from "../../domain/entities/response.entity";

export class GetQuizStatisticsUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly quizRepository: IQuizRepository,
    private readonly quizTemplateRepository: IQuizTemplateRepository,
    private readonly responseRepository: IResponseRepository,
    private readonly answerRepository: IAnswerRepository,
    private readonly organizationFacade: OrganizationFacade,
    private readonly subjectRepository: ISubjectRepository,
    private readonly subjectAssignmentRepository: ISubjectAssignmentRepository,
    private readonly classRepository: IClassRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly responseVisibilityService: ResponseVisibilityService,
    private readonly subscriptionFeatureService: SubscriptionFeatureService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository
  ) {
    super(logger);
  }

  async execute(
    data: GetQuizStatisticsInput
  ): Promise<GetQuizStatisticsOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId
      );

      const quiz = await this.quizRepository.findById(data.quizId);
      if (!quiz) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Quiz not found");
      }

      const subscription =
        await this.subscriptionRepository.findActiveByOrganizationId(
          data.organizationId
        );
      const plan = subscription
        ? await this.subscriptionPlanRepository.findById(subscription.planId)
        : null;

      const allResponses = await this.responseRepository.findByQuiz(
        data.quizId
      );

      const responseEntities = allResponses.map((r) =>
        ResponseEntity.reconstitute(r)
      );

      const visibleResponses =
        this.responseVisibilityService.getVisibleResponses(
          responseEntities,
          subscription,
          plan
        );

      const visibleResponseIds = new Set(visibleResponses.map((r) => r.id));
      const responses = allResponses.filter((r) =>
        visibleResponseIds.has(r.id)
      );

      const allAnswers = await this.answerRepository.findByQuiz(data.quizId);

      const visibleAnswerResponseIds = new Set(responses.map((r) => r.id));
      const visibleAnswers = allAnswers.filter((a) => {
        const response = allResponses.find((r) => r.id === a.responseId);
        return response && visibleAnswerResponseIds.has(response.id);
      });

      const template = await this.quizTemplateRepository.findById(
        quiz.templateId
      );
      if (!template) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Template not found");
      }

      const maxVisibleResponses =
        await this.subscriptionFeatureService.getMaxVisibleResponses(
          data.organizationId
        );

      const questionsStats: QuestionStatistics[] = template.questionsList.map(
        (question) => {
          const questionAnswers = visibleAnswers.filter(
            (answer) => answer.questionId === question.id
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
                {} as Record<number, number>
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
              {} as Record<string, number>
            );
          } else if (question.type === "checkbox") {
            const checkboxValues = questionAnswers
              .map((a) => a.valueCheckbox)
              .filter((v): v is string[] => v !== null && Array.isArray(v));
            stats.optionsDistribution = checkboxValues.flat().reduce(
              (acc, val) => {
                acc[val] = (acc[val] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            );
          } else if (question.type === "textarea") {
            const textValues = questionAnswers
              .map((a) => a.valueText)
              .filter((v): v is string => v !== null && v.trim() !== "");

            if (maxVisibleResponses !== null && maxVisibleResponses > 0) {
              stats.textResponses = textValues.slice(0, maxVisibleResponses);
            } else if (maxVisibleResponses === 0) {
              stats.textResponses = [];
            } else {
              stats.textResponses = textValues;
            }
          }

          return stats;
        }
      );

      const temporalMap = new Map<
        string,
        { count: number; starsSum: number; starsCount: number }
      >();

      responses.forEach((response) => {
        const dateKey = response.submittedAt.toISOString().split("T")[0];
        const existing = temporalMap.get(dateKey) || {
          count: 0,
          starsSum: 0,
          starsCount: 0,
        };
        existing.count += 1;

        const responseAnswers = visibleAnswers.filter(
          (a) => a.responseId === response.id
        );
        const starsAnswer = responseAnswers.find((a) => {
          const q = template.questionsList.find((q) => q.id === a.questionId);
          return q?.type === "stars" && a.valueStars !== null;
        });
        if (
          starsAnswer &&
          starsAnswer.valueStars !== null &&
          starsAnswer.valueStars !== undefined
        ) {
          existing.starsSum += starsAnswer.valueStars;
          existing.starsCount += 1;
        }

        temporalMap.set(dateKey, existing);
      });

      const temporalEvolution: TemporalDataPoint[] = Array.from(
        temporalMap.entries()
      )
        .map(([date, data]) => ({
          date,
          count: data.count,
          averageStars:
            data.starsCount > 0 ? data.starsSum / data.starsCount : undefined,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const subject = await this.subjectRepository.findById(quiz.subjectId);
      let subjectInfo;
      if (subject) {
        const assignments =
          await this.subjectAssignmentRepository.findBySubject(subject.id);
        const activeAssignment = assignments.find((a) => a.isActive);
        if (activeAssignment) {
          const classEntity = await this.classRepository.findById(
            activeAssignment.classId
          );
          if (classEntity) {
            const organization = await this.organizationRepository.findById(
              classEntity.organizationId
            );
            if (organization) {
              subjectInfo = {
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
              };
            }
          }
        }
      }

      // Calculate visibility stats for total responses
      const visibilityStats =
        this.responseVisibilityService.calculateVisibilityStats(
          responseEntities,
          subscription,
          plan
        );

      return {
        quizId: quiz.id,
        totalResponses: allResponses.length,
        visibleResponses: visibilityStats.visible,
        hiddenResponses: visibilityStats.hidden,
        questions: questionsStats.sort((a, b) => a.orderIndex - b.orderIndex),
        temporalEvolution,
        subject: subjectInfo,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
