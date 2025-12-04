import { IEventStore, BaseEventHandler, ILoggerService } from "src/core";

import { SignUpUseCase } from "../use-cases/SignUp.use-case";
import { IAuthIdentityFailedEvent } from "../../domain/types";

export class AuthIdentityFailedHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    readonly eventStore: IEventStore,
    readonly signUpUseCase: SignUpUseCase
  ) {
    super(logger);
  }

  async handle(event: IAuthIdentityFailedEvent): Promise<void> {
    this.logEventHandling(event);

    try {
      await this.signUpUseCase.withCompensation({
        username: event.payload.username,
      });
    } catch (error) {
      this.logEventHandlingError(event, error);
    }
  }

  canHandle(eventName: string): boolean {
    return eventName === "auth_identity.failed";
  }
}
