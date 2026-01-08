import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  GetFeedbackBySubjectInput,
  GetFeedbackBySubjectOutput,
  FeedbackResponse,
} from "../../domain/types";
import { ISubjectRepository } from "src/modules/subject/domain/repositories/subject.repository";
import { IQuizRepository } from "src/modules/quiz/domain/repositories/quiz.repository";
import { IResponseRepository } from "src/modules/quiz/domain/repositories/response.repository";
import { IAnswerRepository } from "src/modules/quiz/domain/repositories/answer.repository";
import { IQuizTemplateRepository } from "src/modules/quiz/domain/repositories/quiz-template.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { ResponseVisibilityService } from "src/modules/quiz/domain/services/response-visibility.service";
import { SubscriptionFeatureService } from "src/modules/subscription/domain/services/subscription-feature.service";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { ResponseEntity } from "src/modules/quiz/domain/entities/response.entity";

export class GetFeedbackBySubjectUseCase
  extends BaseUseCase
  implements IUseCase<GetFeedbackBySubjectInput, GetFeedbackBySubjectOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly subjectRepository: ISubjectRepository,
    private readonly quizRepository: IQuizRepository,
    private readonly responseRepository: IResponseRepository,
    private readonly answerRepository: IAnswerRepository,
    private readonly quizTemplateRepository: IQuizTemplateRepository,
    private readonly organizationFacade: OrganizationFacade,
    private readonly responseVisibilityService: ResponseVisibilityService,
    private readonly subscriptionFeatureService: SubscriptionFeatureService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
  ) {
    super(logger);
  }

  async execute(
    data: GetFeedbackBySubjectInput,
  ): Promise<GetFeedbackBySubjectOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      const subject = await this.subjectRepository.findById(data.subjectId);
      if (!subject) {
        throw new DomainError(ErrorCode.SUBJECT_NOT_FOUND, "Subject not found");
      }

      if (subject.toPersistence().organizationId !== data.organizationId) {
        throw new DomainError(
          ErrorCode.UNAUTHORIZED_ACCESS,
          "Unauthorized access to subject",
        );
      }

      const quiz = await this.quizRepository.findById(data.momentId);
      if (!quiz) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Quiz not found");
      }

      if (quiz.toPersistence().subjectId !== data.subjectId) {
        throw new DomainError(
          ErrorCode.UNAUTHORIZED_ACCESS,
          "Quiz does not belong to subject",
        );
      }

      const subscription =
        await this.subscriptionRepository.findActiveByOrganizationId(
          data.organizationId,
        );
      const plan = subscription
        ? await this.subscriptionPlanRepository.findById(subscription.planId)
        : null;

      const allResponses = await this.responseRepository.findByQuiz(quiz.id);
      const responseEntities = allResponses.map((r) =>
        ResponseEntity.reconstitute(r),
      );

      const visibleResponses =
        this.responseVisibilityService.getVisibleResponses(
          responseEntities,
          subscription,
          plan,
        );

      const visibilityStats =
        this.responseVisibilityService.calculateVisibilityStats(
          responseEntities,
          subscription,
          plan,
        );

      const template = await this.quizTemplateRepository.findById(
        quiz.toPersistence().templateId,
      );
      if (!template) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Template not found");
      }

      const allAnswers = await this.answerRepository.findByQuiz(quiz.id);

      const feedbackResponses: FeedbackResponse[] = visibleResponses.map(
        (response) => {
          const responseAnswers = allAnswers.filter(
            (a) => a.responseId === response.id,
          );

          const answers = responseAnswers.map((answer) => {
            const question = template.questionsList.find(
              (q) => q.id === answer.questionId,
            );

            return {
              questionId: answer.questionId,
              questionText: question?.text || "",
              questionType: question?.type || "textarea",
              valueStars: answer.valueStars,
              valueRadio: answer.valueRadio,
              valueCheckbox: answer.valueCheckbox,
              valueText: answer.valueText,
            };
          });

          return {
            id: response.id,
            submittedAt: response.submittedAt.toISOString(),
            answers,
          };
        },
      );

      return {
        momentId: data.momentId,
        subjectId: data.subjectId,
        responses: feedbackResponses,
        totalResponses: allResponses.length,
        visibleResponses: visibilityStats.visible,
        hiddenResponses: visibilityStats.hidden,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
