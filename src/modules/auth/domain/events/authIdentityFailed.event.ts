import { IDomainEvent } from "src/core";
import { AuthIdentityFailedPayload } from "../types";

export class AuthIdentityFailedEvent
  implements IDomainEvent<AuthIdentityFailedPayload>
{
  readonly name: string = "auth_identity.failed";
  readonly occurredOn: Date;
  readonly payload: AuthIdentityFailedPayload;

  constructor(playload: AuthIdentityFailedPayload) {
    this.occurredOn = new Date();
    this.payload = playload;
  }
}
