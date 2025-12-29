import { ITrialEndingSoonEvent, TrialEndingSoonPayload } from "../types";

export class TrialEndingSoonEvent implements ITrialEndingSoonEvent {
  readonly name: string = "subscription.trial.ending.soon";
  readonly occurredOn: Date;
  readonly payload: TrialEndingSoonPayload;

  constructor(payload: TrialEndingSoonPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
