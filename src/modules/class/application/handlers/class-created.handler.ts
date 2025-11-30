import { BaseEventHandler, ILoggerService } from "src/core";
import { ClassCreatedEvent } from "../../domain/events/classCreated.event";
import { GeneralUtils } from "src/utils/general.utils";
import { CreateEmailNotificationUseCase } from "src/modules/notification/application/use-cases/create-email-notification.use-case";

export class ClassCreatedEventHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase
  ) {
    super(logger);
  }

  async handle(event: ClassCreatedEvent): Promise<void> {
    const className = event.payload.name;
    const template = GeneralUtils.htmlTemplateReader("class-created.html", {
      className,
    });
    const subject = "Votre classe a été créée avec succès";
    await this.createEmailNotificationUseCase.execute({
      subject,
      template,
      target: event.payload.userEmail,
    });
  }

  canHandle(eventName: string): boolean {
    return eventName === "class.created";
  }
}

