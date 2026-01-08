import { ISubjectCreatedEvent, SubjectCreatedPayload } from "../types";

export class SubjectCreatedEvent implements ISubjectCreatedEvent {
  readonly name: string = "subject.created";
  readonly occurredOn: Date;
  readonly payload: SubjectCreatedPayload;

  constructor(payload: SubjectCreatedPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
