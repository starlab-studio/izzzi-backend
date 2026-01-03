import {
  BaseUseCase,
  IUseCase,
  type ILoggerService,
  IEventStore,
} from "src/core";
import { AlertGeneratedEvent } from "../../domain/events/alert-generated.event";
import { CreateAlertInput, CreateAlertOutput } from "../../domain/types";
import { FeedbackAlertEntity } from "../../domain/entities/feedback-alert.entity";
import { IFeedbackAlertRepository } from "../../domain/repositories/feedback-alert.repository";
import { IQuizRepository } from "src/modules/quiz/domain/repositories/quiz.repository";

export class CreateAlertUseCase
  extends BaseUseCase
  implements IUseCase<CreateAlertInput, CreateAlertOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly eventStore: IEventStore,
    private readonly feedbackAlertRepository: IFeedbackAlertRepository,
    private readonly quizRepository: IQuizRepository
  ) {
    super(logger);
  }

  async execute(data: CreateAlertInput): Promise<CreateAlertOutput> {
    try {
      this.logger.info(
        `Creating ${data.alerts.length} alert(s) for subject ${data.subjectId} in organization ${data.organizationId}`
      );
      data.alerts.forEach((alert, idx) => {
        this.logger.info(
          `Alert ${idx + 1}: id=${alert.id}, formType=${alert.formType}, type=${alert.type}, priority=${alert.priority}`
        );
      });

      const storedAlerts: FeedbackAlertEntity[] = [];
      for (const alert of data.alerts) {
        let targetFormTypes: (("during_course" | "after_course") | undefined)[];

        if (alert.formType) {
          targetFormTypes = [alert.formType];
        } else {
          const quizzes = await this.quizRepository.findBySubject(
            data.subjectId
          );
          const formTypes: ("during_course" | "after_course")[] = [];

          for (const quiz of quizzes) {
            const quizType = quiz.toPersistence().type;
            if (
              quizType === "during_course" &&
              !formTypes.includes("during_course")
            ) {
              formTypes.push("during_course");
            } else if (
              quizType === "after_course" &&
              !formTypes.includes("after_course")
            ) {
              formTypes.push("after_course");
            }
          }

          // Si aucun formType trouvé, créer l'alerte sans formType
          targetFormTypes = formTypes.length > 0 ? formTypes : [undefined];
        }

        for (const formType of targetFormTypes) {
          const uniqueAlertId =
            alert.formType || !formType ? alert.id : `${alert.id}_${formType}`;

          const alertEntity = FeedbackAlertEntity.create({
            alertId: uniqueAlertId,
            subjectId: data.subjectId,
            organizationId: data.organizationId,
            type:
              alert.type === "negative"
                ? "negative"
                : alert.type === "alert"
                  ? "alert"
                  : "positive",
            title: alert.title,
            content: alert.content,
            priority: alert.priority,
            number: alert.number,
            timestamp: new Date(alert.timestamp),
            evidence: alert.evidence,
            formType: formType,
          });

          const savedAlert =
            await this.feedbackAlertRepository.create(alertEntity);
          storedAlerts.push(savedAlert);
          this.logger.info(
            `Created alert ${savedAlert.alertId} with formType: ${savedAlert.formType} for subject ${data.subjectId}`
          );
        }
      }

      this.logger.info(
        `Stored ${storedAlerts.length} alert(s) in database for subject ${data.subjectId}`
      );

      const event = new AlertGeneratedEvent({
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        subjectId: data.subjectId,
        subjectName: data.subjectName,
        alerts: data.alerts,
        generatedAt: new Date().toISOString(),
      });

      await this.eventStore.publish(event);

      this.logger.info(
        `Alert event published for organization ${data.organizationId}, subject ${data.subjectId}`
      );

      return {
        success: true,
        message: "Alerts created and notifications sent",
        alertsCount: storedAlerts.length,
      };
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async withCompensation(): Promise<void> {
    // Pas de compensation nécessaire
  }
}
