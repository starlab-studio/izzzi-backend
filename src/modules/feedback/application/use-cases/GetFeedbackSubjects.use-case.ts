import { IUseCase, BaseUseCase, ILoggerService } from "src/core";
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
import { ISubjectSummaryRepository } from "../../domain/repositories/subject-summary.repository";
import { IFeedbackAlertRepository } from "../../domain/repositories/feedback-alert.repository";

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
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
    private readonly subjectSummaryRepository: ISubjectSummaryRepository,
    private readonly feedbackAlertRepository: IFeedbackAlertRepository
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

          let matchesSearch = true;
          if (data.search) {
            const searchLower = data.search.toLowerCase();
            matchesSearch =
              subjectData.name.toLowerCase().includes(searchLower) ||
              subjectData.instructorName?.toLowerCase().includes(searchLower) ||
              classEntity.code.toLowerCase().includes(searchLower);
          }

          const quizTypes = [
            {
              type: "during_course",
              formType: { id: "during", name: "Pendant le cours" },
            },
            {
              type: "after_course",
              formType: { id: "end", name: "Fin du cours" },
            },
          ];

          for (const quizType of quizTypes) {
            const quiz = quizzes.find(
              (q) => q.toPersistence().type === quizType.type
            );

            if (
              data.filter === "pendant_cours" &&
              quizType.type !== "during_course"
            ) {
              continue;
            }
            if (
              data.filter === "fin_cours" &&
              quizType.type !== "after_course"
            ) {
              continue;
            }

            if (!quiz) {
              continue;
            }
            if (!matchesSearch) {
              continue;
            }

            const allResponses = await this.responseRepository.findByQuiz(
              quiz.id
            );
            const responseEntities = allResponses.map((r) =>
              ResponseEntity.reconstitute(r)
            );
            const visibilityStats =
              this.responseVisibilityService.calculateVisibilityStats(
                responseEntities,
                subscription,
                plan
              );

            const hasVisibleRetours = visibilityStats.visible > 0;

            let totalScore = 0;
            let scoreCount = 0;

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

            const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;

            allSubjects.push({
              id: `${subjectData.id}_${quizType.type}`,
              subjectId: subjectData.id,
              name: subjectData.name,
              code: classEntity.name,
              teacher: subjectData.instructorName || "N/A",
              formType: {
                id: quizType.formType.id,
                name: quizType.formType.name,
              },
              feedbackCount: allResponses.length,
              score: averageScore,
              alerts: [], // Will be populated later from DB
              alertsCount: 0, // Will be populated later from DB
              summary: "", // Will be populated later from DB
              fullSummary: "", // Will be populated later from DB
              hasVisibleRetours,
            });
          }
        }
      }

      const mapFormTypeToDb = (
        formTypeId: string | undefined
      ): "during_course" | "after_course" | null => {
        if (formTypeId === "during") return "during_course";
        if (formTypeId === "end") return "after_course";
        return null;
      };

      const uniqueSubjectIds = [
        ...new Set(allSubjects.map((s) => s.subjectId)),
      ];
      const periodDays = 30;

      const allAlerts =
        await this.feedbackAlertRepository.findBySubjectIds(uniqueSubjectIds);
      this.logger.info(
        `Found ${allAlerts.length} total alerts for ${uniqueSubjectIds.length} subjects`
      );
      const alertsBySubjectId = new Map<string, typeof allAlerts>();
      allAlerts.forEach((alert) => {
        const existing = alertsBySubjectId.get(alert.subjectId) || [];
        existing.push(alert);
        alertsBySubjectId.set(alert.subjectId, existing);
        this.logger.info(
          `Alert ${alert.alertId} for subject ${alert.subjectId} has formType: ${alert.formType}`
        );
      });

      const summariesDuring =
        await this.subjectSummaryRepository.findBySubjectIdsAndFormType(
          uniqueSubjectIds,
          periodDays,
          "during_course"
        );
      const summariesAfter =
        await this.subjectSummaryRepository.findBySubjectIdsAndFormType(
          uniqueSubjectIds,
          periodDays,
          "after_course"
        );

      const summaryMap = new Map<string, (typeof summariesDuring)[0]>();
      summariesDuring.forEach((summary) => {
        summaryMap.set(`${summary.subjectId}_during_course`, summary);
      });
      summariesAfter.forEach((summary) => {
        summaryMap.set(`${summary.subjectId}_after_course`, summary);
      });

      const enrichedSubjects = allSubjects.map((subject) => {
        const dbFormType = mapFormTypeToDb(subject.formType?.id);
        const summaryKey = dbFormType
          ? `${subject.subjectId}_${dbFormType}`
          : null;
        const summary = summaryKey ? summaryMap.get(summaryKey) : undefined;

        const allSubjectAlerts = alertsBySubjectId.get(subject.subjectId) || [];
        // Filtrer les alertes par formType
        if (allSubjectAlerts.length > 0) {
          this.logger.info(
            `Subject ${subject.subjectId} (formType: ${subject.formType?.id} -> ${dbFormType}) has ${allSubjectAlerts.length} alerts before filtering`
          );
          allSubjectAlerts.forEach((alert) => {
            this.logger.info(
              `  Alert ${alert.alertId}: formType=${alert.formType}, matches=${alert.formType === dbFormType}`
            );
          });
        }
        // Filtrer les alertes par formType
        // Si dbFormType est défini, prendre les alertes avec ce formType OU sans formType (compatibilité avec anciennes alertes)
        // Si dbFormType n'est pas défini, prendre seulement les alertes sans formType
        const subjectAlerts = dbFormType
          ? allSubjectAlerts.filter(
              (alert) => alert.formType === dbFormType || !alert.formType // Inclure les alertes sans formType pour compatibilité
            )
          : allSubjectAlerts.filter((alert) => !alert.formType); // Si pas de formType spécifié, prendre celles sans formType

        const mappedAlerts: Array<{
          id: string;
          type: "negative" | "positive";
          number: string;
          content: string;
          timestamp: string;
          isProcessed: boolean;
        }> = subjectAlerts.map((alert, index) => ({
          id: alert.alertId,
          type: (alert.type === "negative" ? "negative" : "positive") as
            | "negative"
            | "positive",
          number: `Alerte ${index + 1}/${subjectAlerts.length}`,
          content: alert.content,
          timestamp: alert.timestamp.toISOString(),
          isProcessed: alert.isProcessed,
        }));

        if (summary) {
          const isStale =
            subject.feedbackCount - summary.feedbackCountAtGeneration >= 3;

          return {
            ...subject,
            alerts: mappedAlerts,
            alertsCount: mappedAlerts.length,
            summary: summary.summary,
            fullSummary: summary.fullSummary,
            summaryMetadata: {
              hasSummary: true,
              isStale,
              generatedAt: summary.generatedAt.toISOString(),
              feedbackCountAtGeneration: summary.feedbackCountAtGeneration,
            },
          };
        }

        return {
          ...subject,
          alerts: mappedAlerts,
          alertsCount: mappedAlerts.length,
          summary: "",
          fullSummary: undefined,
          summaryMetadata: {
            hasSummary: false,
            isStale: false,
            generatedAt: null,
            feedbackCountAtGeneration: null,
          },
        };
      });

      if (data.sort === "plus_recent") {
        enrichedSubjects.reverse();
      }

      return { subjects: enrichedSubjects };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
