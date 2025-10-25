import { IDomainEvent } from "src/core";
import { AuthIdentityCreatedPayload } from "../types";

export class AuthIdentityCreatedEvent
  implements IDomainEvent<AuthIdentityCreatedPayload>
{
  readonly name: string = "auth_identity.created";
  readonly occurredOn: Date;
  readonly payload: AuthIdentityCreatedPayload;

  constructor(playload: AuthIdentityCreatedPayload) {
    this.occurredOn = new Date();
    this.payload = playload;
  }
}
