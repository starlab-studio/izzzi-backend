import { IDomainEvent } from "src/core";
import { AlertItem } from "../types";

export interface AlertGeneratedPayload {
  organizationId: string;
  organizationName: string;
  subjectId: string;
  subjectName: string;
  alerts: AlertItem[];
  generatedAt: string;
}

export interface IAlertGeneratedEvent
  extends IDomainEvent<AlertGeneratedPayload> {}

export class AlertGeneratedEvent implements IAlertGeneratedEvent {
  readonly name: string = "alert.generated";
  readonly occurredOn: Date;
  readonly payload: AlertGeneratedPayload;

  constructor(payload: AlertGeneratedPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
