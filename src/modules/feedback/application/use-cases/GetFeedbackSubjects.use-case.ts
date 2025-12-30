import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  GetFeedbackSubjectsInput,
  GetFeedbackSubjectsOutput,
  FeedbackSubjectResponse,
} from "../../domain/types";
import { ISubjectRepository } from "src/modules/subject/domain/repositories/subject.repository";
import { ISubjectAssignmentRepository } from "src/modules/subject/domain/repositories/subject-assignment.repository";
import { IQuizRepository } from "src/modules/quiz/domain/repositories/quiz.repository";
import { IResponseRepository } from "src/modules/quiz/domain/repositories/response.repository";
import { IAnswerRepository } from "src/modules/quiz/domain/repositories/answer.repository";
import { IQuizTemplateRepository } from "src/modules/quiz/domain/repositories/quiz-template.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { IClassRepository } from "src/modules/class/domain/repositories/class.repository";
import { ResponseVisibilityService } from "src/modules/quiz/domain/services/response-visibility.service";
import { SubscriptionFeatureService } from "src/modules/subscription/domain/services/subscription-feature.service";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { ResponseEntity } from "src/modules/quiz/domain/entities/response.entity";

export class GetFeedbackSubjectsUseCase
  extends BaseUseCase
  implements IUseCase<GetFeedbackSubjectsInput, GetFeedbackSubjectsOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly subjectRepository: ISubjectRepository,
    private readonly subjectAssignmentRepository: ISubjectAssignmentRepository,
    private readonly quizRepository: IQuizRepository,
    private readonly responseRepository: IResponseRepository,
    private readonly answerRepository: IAnswerRepository,
    private readonly quizTemplateRepository: IQuizTemplateRepository,
    private readonly organizationFacade: OrganizationFacade,
    private readonly classRepository: IClassRepository,
    private readonly responseVisibilityService: ResponseVisibilityService,
    private readonly subscriptionFeatureService: SubscriptionFeatureService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository
  ) {
    super(logger);
  }

  async execute(
    data: GetFeedbackSubjectsInput
  ): Promise<GetFeedbackSubjectsOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId
      );

      const subscription =
        await this.subscriptionRepository.findActiveByOrganizationId(
          data.organizationId
        );
      const plan = subscription
        ? await this.subscriptionPlanRepository.findById(subscription.planId)
        : null;

      const classes = await this.classRepository.findByOrganization(
        data.organizationId
      );

      const allSubjects: FeedbackSubjectResponse[] = [];

      for (const classEntity of classes) {
        const isClassArchived = classEntity.status === "archived";

        if (data.tab === "ongoing" && isClassArchived) {
          continue;
        }
        if (data.tab === "finished" && !isClassArchived) {
          continue;
        }

        const subjectAssignments =
          await this.subjectAssignmentRepository.findByClass(classEntity.id);

        const assignmentsToProcess = isClassArchived
          ? subjectAssignments
          : subjectAssignments.filter((assignment) => assignment.isActive);

        for (const assignment of assignmentsToProcess) {
          const subjectEntity = await this.subjectRepository.findById(
            assignment.subjectId
          );

          if (
            !subjectEntity ||
            (isClassArchived ? false : !subjectEntity.isActive)
          ) {
            continue;
          }

          const subjectData = subjectEntity.toPersistence();

          const quizzes = await this.quizRepository.findBySubject(
            subjectData.id
          );

          let totalFeedbackCount = 0;
          let totalScore = 0;
          let scoreCount = 0;
          let hasVisibleRetours = false;

          for (const quiz of quizzes) {
            const allResponses = await this.responseRepository.findByQuiz(
              quiz.id
            );
            totalFeedbackCount += allResponses.length;

            const responseEntities = allResponses.map((r) =>
              ResponseEntity.reconstitute(r)
            );
            const visibilityStats =
              this.responseVisibilityService.calculateVisibilityStats(
                responseEntities,
                subscription,
                plan
              );

            if (visibilityStats.visible > 0) {
              hasVisibleRetours = true;
            }

            const template = await this.quizTemplateRepository.findById(
              quiz.toPersistence().templateId
            );

            if (template) {
              const allAnswers = await this.answerRepository.findByQuiz(
                quiz.id
              );

              const starQuestions = template.questionsList.filter(
                (q) => q.type === "stars"
              );

              for (const starQuestion of starQuestions) {
                const starAnswers = allAnswers.filter(
                  (a) =>
                    a.questionId === starQuestion.id &&
                    a.valueStars !== null &&
                    a.valueStars !== undefined
                );

                for (const answer of starAnswers) {
                  if (answer.valueStars !== null) {
                    totalScore += answer.valueStars;
                    scoreCount += 1;
                  }
                }
              }
            }
          }

          const duringQuiz = quizzes.find(
            (q) => q.toPersistence().type === "during_course"
          );
          const endQuiz = quizzes.find(
            (q) => q.toPersistence().type === "after_course"
          );
          const formType = duringQuiz
            ? { id: "during", name: "Pendant le cours" }
            : endQuiz
              ? { id: "end", name: "Fin du cours" }
              : null;

          if (data.search) {
            const searchLower = data.search.toLowerCase();
            const matchesSearch =
              subjectData.name.toLowerCase().includes(searchLower) ||
              subjectData.instructorName?.toLowerCase().includes(searchLower) ||
              classEntity.name.toLowerCase().includes(searchLower) ||
              classEntity.code.toLowerCase().includes(searchLower);

            if (!matchesSearch) {
              continue;
            }
          }

          if (data.filter === "pendant_cours" && !duringQuiz) {
            continue;
          }
          if (data.filter === "fin_cours" && !endQuiz) {
            continue;
          }

          const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;

          allSubjects.push({
            id: subjectData.id,
            name: subjectData.name,
            code: classEntity.name,
            teacher: subjectData.instructorName || "N/A",
            formType: formType
              ? {
                  id: formType.id,
                  name: formType.name,
                }
              : null,
            feedbackCount: totalFeedbackCount,
            score: averageScore,
            alerts: [], // TODO: Implement alert calculation
            alertsCount: 0, // TODO: Implement alert calculation
            summary: "", // TODO: Get from AI analysis if available
            hasVisibleRetours,
          });
        }
      }

      if (data.sort === "plus_recent") {
        allSubjects.reverse();
      }

      return { subjects: allSubjects };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
