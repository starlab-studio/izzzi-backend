import {
  ISubscriptionUpgradedEvent,
  SubscriptionUpgradedPayload,
} from "../types";

export class SubscriptionUpgradedEvent implements ISubscriptionUpgradedEvent {
  readonly name: string = "subscription.upgraded";
  readonly occurredOn: Date;
  readonly payload: SubscriptionUpgradedPayload;

  constructor(payload: SubscriptionUpgradedPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
