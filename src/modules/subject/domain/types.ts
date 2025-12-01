import { IDomainEvent } from "src/core";

export interface ISubject {
  readonly id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  organizationId: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ISubjectCreate = Pick<
  ISubject,
  "name" | "description" | "color" | "organizationId" | "userId"
>;

export interface SubjectCreatedPayload {
  id: string;
  name: string;
  description?: string;
  color: string;
  organizationId: string;
  userId: string;
  userEmail: string;
}

export type ISubjectCreatedEvent = IDomainEvent<SubjectCreatedPayload>;
