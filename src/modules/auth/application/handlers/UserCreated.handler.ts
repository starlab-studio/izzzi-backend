import { BaseEventHandler, ILoggerService } from "src/core";

import { SignUpSucceedEvent } from "src/modules/auth/domain/events/signUpSucceedEvent.event";
import { AuthIdentityRepository } from "../../infrastructure/repositories/authIdentity.repository";

export class UserCreatedEventHandler extends BaseEventHandler {
  constructor(
    readonly logger: ILoggerService,
    private readonly authIdentityRepository: AuthIdentityRepository
  ) {
    super(logger);
  }

  async handle(event: SignUpSucceedEvent): Promise<void> {
    const authIdentity = await this.authIdentityRepository.findByUsername(
      event.payload.email
    );
    if (!authIdentity) return; // TODO: penser un mécanisme de gestion de l'erreur

    authIdentity?.setUser(event.payload.id);
    await this.authIdentityRepository.save(authIdentity);
  }

  canHandle(eventName: string): boolean {
    return eventName === "signup.succeed";
  }
}
