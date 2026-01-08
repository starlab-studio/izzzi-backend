import { BaseEventHandler, ILoggerService } from "src/core";
import { SubjectCreatedEvent } from "src/modules/subject/domain/events/subjectCreated.event";
import { GeneralUtils } from "src/utils/general.utils";
import { CreateEmailNotificationUseCase } from "../use-cases/create-email-notification.use-case";

export class SubjectCreatedEventHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase,
  ) {
    super(logger);
  }

  async handle(event: SubjectCreatedEvent): Promise<void> {
    try {
      this.logger.info(
        `Handling subject created event for subject ${event.payload.name}`,
      );

      const subjectName = event.payload.name;
      const template = GeneralUtils.htmlTemplateReader("subject-created.html", {
        subjectName,
      });
      const subject = "Votre matière a été créée avec succès";

      await this.createEmailNotificationUseCase.execute({
        subject,
        template,
        target: event.payload.userEmail,
      });

      this.logger.info(
        `Subject created notification sent to ${event.payload.userEmail}`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling subject created event: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack || "" : "",
      );
    }
  }

  canHandle(eventName: string): boolean {
    return eventName === "subject.created";
  }
}
