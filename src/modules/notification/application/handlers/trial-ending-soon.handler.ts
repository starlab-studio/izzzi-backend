import { BaseEventHandler, ILoggerService } from "src/core";
import { TrialEndingSoonEvent } from "src/modules/subscription/domain/events/trial-ending-soon.event";
import { GeneralUtils } from "src/utils/general.utils";
import { CreateEmailNotificationUseCase } from "../use-cases/create-email-notification.use-case";

export class TrialEndingSoonEventHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase,
  ) {
    super(logger);
  }

  async handle(event: TrialEndingSoonEvent): Promise<void> {
    try {
      if (event.payload.adminEmails.length === 0) {
        this.logger.warn(
          `No admin emails found for organization ${event.payload.organizationId}`,
        );
        return;
      }

      const frontendUrl =
        process.env.FRONTEND_URL ||
        process.env.FRONTEND_DOMAIN_URL ||
        "http://localhost:3001";

      const trialEndDate = new Date(event.payload.trialEndDate);
      const formattedDate = trialEndDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const templateVars = {
        trialEndDate: formattedDate,
        planName: event.payload.planName,
        subscriptionManagementUrl: `${frontendUrl}/dashboard/admin/subscription`,
      };

      const template = GeneralUtils.htmlTemplateReader(
        "trial-ending-soon.html",
        templateVars,
      );
      const subject = "Votre période d'essai se termine bientôt";

      const emailPromises = event.payload.adminEmails.map((email) =>
        this.createEmailNotificationUseCase.execute({
          subject,
          template,
          target: email,
        }),
      );

      await Promise.all(emailPromises);

      this.logger.info(
        `Trial ending soon notification sent to ${event.payload.adminEmails.length} admin(s) for organization ${event.payload.organizationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling trial ending soon event: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack || "" : "",
      );
    }
  }

  canHandle(eventName: string): boolean {
    return eventName === "subscription.trial.ending.soon";
  }
}
