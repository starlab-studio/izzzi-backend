import { BaseEventHandler, ILoggerService, UserRole } from "src/core";
import { ReportGeneratedEvent } from "src/modules/report/domain/events/report-generated.event";
import { GeneralUtils } from "src/utils/general.utils";
import { CreateEmailNotificationUseCase } from "../use-cases/create-email-notification.use-case";
import { CreatePushNotificationUseCase } from "../use-cases/create-push-notification.use-case";
import { IMembershipRepository } from "src/modules/organization/domain/repositories/membership.repository";
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { MembershipStatus } from "src/modules/organization/domain/types";

export class ReportGeneratedEventHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase,
    private readonly createPushNotificationUseCase: CreatePushNotificationUseCase,
    private readonly membershipRepository: IMembershipRepository,
    private readonly userRepository: IUserRepository
  ) {
    super(logger);
  }

  async handle(event: ReportGeneratedEvent): Promise<void> {
    try {
      this.logger.info(
        `Handling report generated event for organization ${event.payload.organizationId}`
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

      const templateVars = {
        organizationName: event.payload.organizationName,
        reportContent: event.payload.reportContent,
        generatedAt: new Date(event.payload.generatedAt).toLocaleDateString(
          "fr-FR",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        ),
      };

      const template = GeneralUtils.htmlTemplateReader(
        "weekly-report.html",
        templateVars
      );
      const subject = `Rapport hebdomadaire - ${event.payload.organizationName}`;

      const notificationPromises = userData.map(async ({ email, userId }) => {
        await this.createEmailNotificationUseCase.execute({
          subject,
          template,
          target: email,
        });

        await this.createPushNotificationUseCase.execute({
          target: userId,
          message: `Rapport hebdomadaire disponible pour ${event.payload.organizationName}`,
        });
      });

      await Promise.all(notificationPromises);

      this.logger.info(
        `Report notifications sent to ${userData.length} user(s) for organization ${event.payload.organizationId}`
      );
    } catch (error) {
      this.logger.error(
        `Error handling report generated event: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack || "" : ""
      );
    }
  }

  canHandle(eventName: string): boolean {
    return eventName === "report.generated";
  }
}
