import { BaseEventHandler, ILoggerService } from "src/core";
import { ClassArchivedEvent } from "src/modules/class/domain/events/classArchived.event";
import { GeneralUtils } from "src/utils/general.utils";
import { CreateEmailNotificationUseCase } from "../use-cases/create-email-notification.use-case";

export class ClassArchivedEventHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase
  ) {
    super(logger);
  }

  async handle(event: ClassArchivedEvent): Promise<void> {
    const className = event.payload.name;
    const template = GeneralUtils.htmlTemplateReader("class-archived.html", {
      className,
    });
    const subject = "Votre classe a été archivée";
    await this.createEmailNotificationUseCase.execute({
      subject,
      template,
      target: event.payload.userEmail,
    });
  }

  canHandle(eventName: string): boolean {
    return eventName === "class.archived";
  }
}

