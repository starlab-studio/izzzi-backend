import { BaseEventHandler, ILoggerService } from "src/core";

import { GeneralUtils } from "src/utils/general.utils";
import { CreateEmailNotificationUseCase } from "../use-cases/create-email-notification.use-case";
import { SignUpSucceedEvent } from "src/modules/auth/domain/events/signUpSucceedEvent.event";

export class UserCreatedEventHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase,
  ) {
    super(logger);
  }

  async handle(event: SignUpSucceedEvent): Promise<void> {
    if (!event.payload.sendVerificationToken) {
      this.logger.info(
        `Skipping verification email for ${event.payload.email} (sendVerificationToken=false)`,
      );
      return;
    }

    const verificationLink = event.payload.verificationLink;
    const firstName = event.payload.firstName;
    const template = GeneralUtils.htmlTemplateReader("confirmation.html", {
      verificationLink,
      firstName,
    });
    const subject = "Confirmez votre adresse e-mail";
    await this.createEmailNotificationUseCase.execute({
      subject,
      template,
      target: event.payload.email,
    });
  }

  canHandle(eventName: string): boolean {
    return eventName === "signup.succeed";
  }
}
