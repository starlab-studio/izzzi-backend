import { IInvitationSentEvent, InvitationSentPayload } from "../types";

export class InvitationSentEvent implements IInvitationSentEvent {
  readonly name: string = "invitation.sent";
  readonly occurredOn: Date;
  readonly payload: InvitationSentPayload;

  constructor(payload: InvitationSentPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
