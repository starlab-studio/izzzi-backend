import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  GetSubjectsByClassInput,
  GetSubjectsByClassOutput,
  ClassSubjectDetailsResponse,
} from "../../domain/types";
import { ISubjectRepository } from "../../domain/repositories/subject.repository";
import { ISubjectAssignmentRepository } from "../../domain/repositories/subject-assignment.repository";
import { IClassRepository } from "src/modules/class/domain/repositories/class.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { IQuizRepository } from "src/modules/quiz/domain/repositories/quiz.repository";
import { IResponseRepository } from "src/modules/quiz/domain/repositories/response.repository";
import { ResponseVisibilityService } from "src/modules/quiz/domain/services/response-visibility.service";
import { SubscriptionFeatureService } from "src/modules/subscription/domain/services/subscription-feature.service";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { ResponseEntity } from "src/modules/quiz/domain/entities/response.entity";

export class GetSubjectsByClassUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly classRepository: IClassRepository,
    private readonly subjectRepository: ISubjectRepository,
    private readonly subjectAssignmentRepository: ISubjectAssignmentRepository,
    private readonly organizationFacade: OrganizationFacade,
    private readonly quizRepository: IQuizRepository,
    private readonly responseRepository: IResponseRepository,
    private readonly responseVisibilityService: ResponseVisibilityService,
    private readonly subscriptionFeatureService: SubscriptionFeatureService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository
  ) {
    super(logger);
  }

  async execute(
    data: GetSubjectsByClassInput
  ): Promise<GetSubjectsByClassOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId
      );

      const classEntity = await this.classRepository.findById(data.classId);
      if (!classEntity) {
        throw new DomainError(ErrorCode.CLASS_NOT_FOUND, "Class not found");
      }

      if (classEntity.organizationId !== data.organizationId) {
        throw new DomainError(
          ErrorCode.UNAUTHORIZED_ACCESS,
          "Unauthorized access to class"
        );
      }

      const isClassArchived = classEntity.status === "archived";

      const subscription =
        await this.subscriptionRepository.findActiveByOrganizationId(
          data.organizationId
        );
      const plan = subscription
        ? await this.subscriptionPlanRepository.findById(subscription.planId)
        : null;

      const subjectAssignments =
        await this.subjectAssignmentRepository.findByClass(data.classId);

      const assignmentsToProcess = isClassArchived
        ? subjectAssignments
        : subjectAssignments.filter((assignment) => assignment.isActive);

      const assignmentOrderMap = new Map<string, number>();
      assignmentsToProcess.forEach((assignment) => {
        assignmentOrderMap.set(assignment.subjectId, assignment.orderIndex);
      });

      const classSubjects: ClassSubjectDetailsResponse[] = [];

      const formatDateToString = (
        date: Date | string | null | undefined
      ): string | null => {
        if (!date) return null;
        if (date instanceof Date) {
          return date.toISOString().split("T")[0];
        }
        if (typeof date === "string") {
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
          }
          const parsed = new Date(date);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split("T")[0];
          }
        }
        return null;
      };

      for (const assignment of assignmentsToProcess) {
        const subjectEntity = await this.subjectRepository.findById(
          assignment.subjectId
        );

        if (subjectEntity && (isClassArchived || subjectEntity.isActive)) {
          const subjectData = subjectEntity.toPersistence();

          const quizzes = await this.quizRepository.findBySubject(
            subjectData.id
          );

          const feedbackMoments = await Promise.all(
            quizzes.map(async (quiz) => {
              const quizData = quiz.toPersistence();

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

              const typeLabel =
                quizData.type === "during_course"
                  ? "Pendant le cours"
                  : "Fin du cours";
              const icon: "clock" | "check" =
                quizData.type === "during_course" ? "clock" : "check";
              const type: "during" | "end" =
                quizData.type === "during_course" ? "during" : "end";

              return {
                id: quiz.id,
                type,
                label: typeLabel,
                icon,
                formLink: quizData.publicUrl || "",
                qrCodeUrl: quizData.qrCodeUrl || undefined,
                feedbackStats: {
                  received: allResponses.length,
                  total: allResponses.length,
                  visible: visibilityStats.visible,
                  hidden: visibilityStats.hidden,
                },
                canEdit: !isClassArchived && quizData.status === "draft",
                lastReminderSent: undefined, // TODO: Implement reminder tracking if needed
              };
            })
          );

          classSubjects.push({
            id: subjectData.id,
            name: subjectData.name,
            instructorName: subjectData.instructorName || null,
            instructorEmail: subjectData.instructorEmail || null,
            firstCourseDate: formatDateToString(subjectData.firstCourseDate),
            lastCourseDate: formatDateToString(subjectData.lastCourseDate),
            formType: null,
            feedbackMoments,
          });
        }
      }

      classSubjects.sort((a, b) => {
        const orderA = assignmentOrderMap.get(a.id) ?? 0;
        const orderB = assignmentOrderMap.get(b.id) ?? 0;
        return orderA - orderB;
      });

      return { subjects: classSubjects };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
