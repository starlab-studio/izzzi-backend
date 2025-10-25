import { IUserFailedEvent, UserFailedPayload } from "../types";

export class UserFailedEvent implements IUserFailedEvent {
  readonly name: string = "user.failed";
  readonly occurredOn: Date;
  readonly payload: UserFailedPayload;

  constructor(payload: UserFailedPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
