import { BaseEventHandler, ILoggerService } from "src/core";
import { GeneralUtils } from "src/utils/general.utils";
import { CreateEmailNotificationUseCase } from "../use-cases/create-email-notification.use-case";
import { InvitationAcceptedEvent } from "src/modules/organization/domain/events/invitation-accepted.event";

export class InvitationAcceptedEventHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase,
  ) {
    super(logger);
  }

  async handle(event: InvitationAcceptedEvent): Promise<void> {
    if (!event.payload.firstName) return;

    const signInUrl = "http://localhost:3001/auth/authenticate"; // TODO : charger le base url dynamiquement

    const template = GeneralUtils.htmlTemplateReader("welcome.html", {
      signInUrl,
    });
    const subject = "Bienvenue sur IZZZI";
    await this.createEmailNotificationUseCase.execute({
      subject,
      template,
      target: event.payload.email,
    });
  }

  canHandle(eventName: string): boolean {
    return eventName === "invitation.accepted";
  }
}
