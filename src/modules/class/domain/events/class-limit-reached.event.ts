import { IClassLimitReachedEvent, ClassLimitReachedPayload } from "../types";

export class ClassLimitReachedEvent implements IClassLimitReachedEvent {
  readonly name: string = "class.limit.reached";
  readonly occurredOn: Date;
  readonly payload: ClassLimitReachedPayload;

  constructor(payload: ClassLimitReachedPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
