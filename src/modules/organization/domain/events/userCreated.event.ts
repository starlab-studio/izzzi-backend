import { IUserCreatedEvent, UserCreatedPayload } from "../types";

export class UserCreatedEvent implements IUserCreatedEvent {
  readonly name: string = "user.created";
  readonly occurredOn: Date;
  readonly payload: UserCreatedPayload;

  constructor(payload: UserCreatedPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
