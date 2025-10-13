import { IDomainEvent } from "src/core";
import { IUserCreate } from "../../domain/types";

export class UserCreatedEvent implements IDomainEvent<IUserCreate> {
  readonly name: string = "user.created";
  readonly occurredOn: Date;
  readonly payload: IUserCreate;

  constructor(playload: IUserCreate) {
    this.occurredOn = new Date();
    this.payload = playload;
  }
}
