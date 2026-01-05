import { BaseEventHandler, ILoggerService, UserRole } from "src/core";
import { AlertGeneratedEvent } from "src/modules/feedback/domain/events/alert-generated.event";
import { GeneralUtils } from "src/utils/general.utils";
import { CreateEmailNotificationUseCase } from "../use-cases/create-email-notification.use-case";
import { CreatePushNotificationUseCase } from "../use-cases/create-push-notification.use-case";
import { IMembershipRepository } from "src/modules/organization/domain/repositories/membership.repository";
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { MembershipStatus } from "src/modules/organization/domain/types";

export class AlertGeneratedEventHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase,
    private readonly createPushNotificationUseCase: CreatePushNotificationUseCase,
    private readonly membershipRepository: IMembershipRepository,
    private readonly userRepository: IUserRepository
  ) {
    super(logger);
  }

  async handle(event: AlertGeneratedEvent): Promise<void> {
    try {
      this.logger.info(
        `Handling alert generated event for organization ${event.payload.organizationId}, subject ${event.payload.subjectId}`
      );

      const memberships = await this.membershipRepository.findByOrganization(
        event.payload.organizationId
      );

      const relevantMemberships = memberships.filter(
        (membership) =>
          (membership.role === UserRole.ADMIN ||
            membership.role === UserRole.LEARNING_MANAGER) &&
          membership.status === MembershipStatus.ACTIVE
      );

      if (relevantMemberships.length === 0) {
        this.logger.warn(
          `No active admin or learning manager members found for organization ${event.payload.organizationId}`
        );
        return;
      }

      const userData: Array<{ email: string; userId: string }> = [];
      for (const membership of relevantMemberships) {
        const user = await this.userRepository.findById(membership.userId);
        if (user && user.email) {
          userData.push({ email: user.email, userId: user.id });
        }
      }

      if (userData.length === 0) {
        this.logger.warn(
          `No user emails found for organization ${event.payload.organizationId}`
        );
        return;
      }

      const alertsList = event.payload.alerts
        .map(
          (alert) => `
        <div class="alert-item">
          <h3>${alert.title}</h3>
          <div class="alert-meta">
            <p><strong>Type:</strong> ${alert.type === "negative" ? "Négatif" : "Alerte"}</p>
            <p><strong>Priorité:</strong> ${alert.priority}</p>
          </div>
          <div class="alert-content">${alert.content}</div>
          ${
            alert.evidence && alert.evidence.length > 0
              ? `<div class="alert-evidence"><strong>Preuves:</strong> ${alert.evidence.slice(0, 3).join(", ")}</div>`
              : ""
          }
        </div>
      `
        )
        .join("");

      const templateVars = {
        organizationName: event.payload.organizationName,
        subjectName: event.payload.subjectName,
        alertsCount: event.payload.alerts.length,
        alertsList: alertsList,
        generatedAt: new Date(event.payload.generatedAt).toLocaleDateString(
          "fr-FR",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
      };

      const template = GeneralUtils.htmlTemplateReader(
        "alert.html",
        templateVars
      );

      const subject = `${event.payload.alerts.length} alerte(s) détectée(s) - ${event.payload.subjectName}`;

      const hasNegativeAlert = event.payload.alerts.some(
        (alert) => alert.type === "negative"
      );
      const alertType = hasNegativeAlert ? "negative" : "alert";

      const notificationPromises = userData.map(async ({ email, userId }) => {
        await this.createEmailNotificationUseCase.execute({
          subject,
          template,
          target: email,
        });

        await this.createPushNotificationUseCase.execute({
          target: userId,
          message: `${event.payload.alerts.length} alerte(s) détectée(s) pour ${event.payload.subjectName}`,
          metadata: {
            subjectId: event.payload.subjectId,
            alertType: alertType,
            alertsCount: event.payload.alerts.length,
          },
        });
      });

      await Promise.all(notificationPromises);

      this.logger.info(
        `Alert notifications sent to ${userData.length} user(s) for organization ${event.payload.organizationId}, subject ${event.payload.subjectId}`
      );
    } catch (error) {
      this.logger.error(
        `Error handling alert generated event: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack || "" : ""
      );
    }
  }

  canHandle(eventName: string): boolean {
    return eventName === "alert.generated";
  }
}
