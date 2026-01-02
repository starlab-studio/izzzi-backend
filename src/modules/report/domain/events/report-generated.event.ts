import { IDomainEvent } from "src/core";

export interface ReportGeneratedPayload {
  organizationId: string;
  organizationName: string;
  reportContent: string;
  subjectIds: string[];
  generatedAt: string;
}

export interface IReportGeneratedEvent
  extends IDomainEvent<ReportGeneratedPayload> {}

export class ReportGeneratedEvent implements IReportGeneratedEvent {
  readonly name: string = "report.generated";
  readonly occurredOn: Date;
  readonly payload: ReportGeneratedPayload;

  constructor(payload: ReportGeneratedPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
