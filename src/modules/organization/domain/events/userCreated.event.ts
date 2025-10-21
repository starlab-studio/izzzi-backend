import { IDomainEvent } from "src/core";
import { IUserCreate } from "../types";

export type UserCreatedPayload = { id: string } & IUserCreate;

export class UserCreatedEvent implements IDomainEvent<UserCreatedPayload> {
  readonly name: string = "user.created";
  readonly occurredOn: Date;
  readonly payload: UserCreatedPayload;

  constructor(payload: UserCreatedPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
