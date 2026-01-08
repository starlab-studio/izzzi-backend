import { IInvitationAcceptedEvent, InvitationAcceptedPayload } from "../types";

export class InvitationAcceptedEvent implements IInvitationAcceptedEvent {
  readonly name: string = "invitation.accepted";
  readonly occurredOn: Date;
  readonly payload: InvitationAcceptedPayload;

  constructor(payload: InvitationAcceptedPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
