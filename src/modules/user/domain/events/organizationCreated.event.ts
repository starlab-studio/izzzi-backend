import { IDomainEvent } from "src/core";
import { IOrganization } from "../../domain/types";

export type OrganizationCreatedPayload = IOrganization;

export class OrganizationCreatedEvent
  implements IDomainEvent<OrganizationCreatedPayload>
{
  readonly name: string = "organization.created";
  readonly occurredOn: Date;
  readonly payload: OrganizationCreatedPayload;

  constructor(payload: OrganizationCreatedPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
