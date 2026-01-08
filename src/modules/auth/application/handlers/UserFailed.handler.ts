import { IEventStore, BaseEventHandler, ILoggerService } from "src/core";
import { SignUpUseCase } from "../use-cases/SignUp.use-case";
import { IUserFailedEvent } from "../../domain/types";

export class UserFailedHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    readonly eventStore: IEventStore,
    readonly signUpUseCase: SignUpUseCase
  ) {
    super(logger);
  }

  async handle(event: IUserFailedEvent): Promise<void> {
    this.logEventHandling(event);

    try {
      await this.signUpUseCase.withCompensation(event.payload);
    } catch (error) {
      this.logEventHandlingError(
        event,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  canHandle(eventName: string): boolean {
    return eventName === "user.failed";
  }
}
