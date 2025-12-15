import { BaseEventHandler, ILoggerService, UserRole } from "src/core";

import { GeneralUtils } from "src/utils/general.utils";
import { CreateEmailNotificationUseCase } from "../use-cases/create-email-notification.use-case";
import { InvitationSentEvent } from "src/modules/organization/domain/events/invitation-sent.event";

export class InvitationSentEventHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase
  ) {
    super(logger);
  }

  async handle(event: InvitationSentEvent): Promise<void> {
    if (!event.payload.invitationLink) return;

    const invitationLink = event.payload.invitationLink;
    const inviterName = event.payload.inviterName;
    const role =
      event.payload.role === UserRole.ADMIN
        ? "ADMIN"
        : "RESPONSABLE PÉDAGOGIQUE";
    const template = GeneralUtils.htmlTemplateReader("invitation.html", {
      invitationLink,
      inviterName,
      role,
    });
    const subject = "Invitation à rejoindre IZZZI";
    await this.createEmailNotificationUseCase.execute({
      subject,
      template,
      target: event.payload.email,
    });
  }

  canHandle(eventName: string): boolean {
    return eventName === "invitation.sent";
  }
}
