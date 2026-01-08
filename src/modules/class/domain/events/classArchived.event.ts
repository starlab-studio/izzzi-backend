import { IClassArchivedEvent, ClassArchivedPayload } from "../types";

export class ClassArchivedEvent implements IClassArchivedEvent {
  readonly name: string = "class.archived";
  readonly occurredOn: Date;
  readonly payload: ClassArchivedPayload;

  constructor(payload: ClassArchivedPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
