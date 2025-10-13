import {
  EventStore,
  BaseEventHandler,
  ILoggerService,
  AuthIdentityCreatedEvent,
} from "src/core";

import { UserService } from "../services/user.service";

export class AuthIdentityCreatedHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    readonly eventStore: EventStore,
    readonly service: UserService
  ) {
    super(logger);
  }

  async handle(event: AuthIdentityCreatedEvent): Promise<void> {
    this.logEventHandling(event);

    try {
      await this.service.createUser(event.payload);
    } catch (error) {
      this.logEventHandlingError(event, error);
    }
  }

  canHandle(eventName: string): boolean {
    return eventName === "auth_identity.created";
  }
}
