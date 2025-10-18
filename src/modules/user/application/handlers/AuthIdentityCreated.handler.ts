import {
  EventStore,
  BaseEventHandler,
  ILoggerService,
  AuthIdentityCreatedEvent,
} from "src/core";

import { CreateUserUseCase } from "../use-cases/CreateUser.use-case";

export class AuthIdentityCreatedHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    readonly eventStore: EventStore,
    readonly userCreateUseCase: CreateUserUseCase
  ) {
    super(logger);
  }

  async handle(event: AuthIdentityCreatedEvent): Promise<void> {
    this.logEventHandling(event);

    try {
      await this.userCreateUseCase.execute(event.payload);
    } catch (error) {
      this.logEventHandlingError(event, error);
    }
  }

  canHandle(eventName: string): boolean {
    return eventName === "auth_identity.created";
  }
}
