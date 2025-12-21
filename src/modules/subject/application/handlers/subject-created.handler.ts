import { BaseEventHandler, ILoggerService } from "src/core";
import { SubjectCreatedEvent } from "../../domain/events/subjectCreated.event";
import { GeneralUtils } from "src/utils/general.utils";
import { CreateEmailNotificationUseCase } from "src/modules/notification/application/use-cases/create-email-notification.use-case";

export class SubjectCreatedEventHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase,
  ) {
    super(logger);
  }

  async handle(event: SubjectCreatedEvent): Promise<void> {
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
  }

  canHandle(eventName: string): boolean {
    return eventName === "subject.created";
  }
}
