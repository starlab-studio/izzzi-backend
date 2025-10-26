import { IEventStore, BaseEventHandler, ILoggerService } from "src/core";
import { CreateAuthIdentityUseCase } from "../use-cases/CreateAuthIdentity.use-case";
import { IUserFailedEvent } from "../../domain/types";

export class UserFailedHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    readonly eventStore: IEventStore,
    readonly createAuthIdentityUseCase: CreateAuthIdentityUseCase
  ) {
    super(logger);
  }

  async handle(event: IUserFailedEvent): Promise<void> {
    this.logEventHandling(event);

    try {
      await this.createAuthIdentityUseCase.withCompenstation(event.payload);
    } catch (error) {
      this.logEventHandlingError(event, error);
    }
  }

  canHandle(eventName: string): boolean {
    return eventName === "user.failed";
  }
}
