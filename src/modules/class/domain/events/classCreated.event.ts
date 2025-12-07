import { IClassCreatedEvent, ClassCreatedPayload } from "../types";

export class ClassCreatedEvent implements IClassCreatedEvent {
  readonly name: string = "class.created";
  readonly occurredOn: Date;
  readonly payload: ClassCreatedPayload;

  constructor(payload: ClassCreatedPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
