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

export class CreateAlertUseCase
  extends BaseUseCase
  implements IUseCase<CreateAlertInput, CreateAlertOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly eventStore: IEventStore,
    private readonly feedbackAlertRepository: IFeedbackAlertRepository
  ) {
    super(logger);
  }

  async execute(data: CreateAlertInput): Promise<CreateAlertOutput> {
    try {
      this.logger.info(
        `Creating ${data.alerts.length} alert(s) for subject ${data.subjectId} in organization ${data.organizationId}`
      );

      // Stocker chaque alerte dans la base de données
      const storedAlerts: FeedbackAlertEntity[] = [];
      for (const alert of data.alerts) {
        const alertEntity = FeedbackAlertEntity.create({
          alertId: alert.id,
          subjectId: data.subjectId,
          organizationId: data.organizationId,
        });

        const savedAlert =
          await this.feedbackAlertRepository.create(alertEntity);
        storedAlerts.push(savedAlert);
      }

      this.logger.info(
        `Stored ${storedAlerts.length} alert(s) in database for subject ${data.subjectId}`
      );

      // Émettre l'événement avec toutes les alertes
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
