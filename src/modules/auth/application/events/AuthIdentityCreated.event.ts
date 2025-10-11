import { IDomainEvent } from "src/core";
import { SignUpResponse } from "../../domain/types";

export class AuthIdentityCreatedEvent implements IDomainEvent<SignUpResponse> {
  readonly name: string = "auth_identity.created";
  readonly occurredOn: Date;
  readonly payload: SignUpResponse;

  constructor(playload: SignUpResponse) {
    this.occurredOn = new Date();
    this.payload = playload;
  }
}
