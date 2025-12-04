import { IDomainEvent } from "src/core";

export interface EmailVerifiedPayload {
  authIdentityId: string;
  email: string;
  verifiedAt: Date;
}

export class EmailVerifiedEvent implements IDomainEvent<EmailVerifiedPayload> {
  readonly name: string = "auth_identity.email.verified";
  readonly occurredOn: Date;
  readonly payload: EmailVerifiedPayload;

  constructor(playload: EmailVerifiedPayload) {
    this.occurredOn = new Date();
    this.payload = playload;
  }
}
