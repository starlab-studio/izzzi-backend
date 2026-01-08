import {
  ISubscriptionActivatedEvent,
  SubscriptionActivatedPayload,
} from "../types";

export class SubscriptionActivatedEvent implements ISubscriptionActivatedEvent {
  readonly name: string = "subscription.activated";
  readonly occurredOn: Date;
  readonly payload: SubscriptionActivatedPayload;

  constructor(payload: SubscriptionActivatedPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
