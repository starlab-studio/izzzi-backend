import { IDomainEvent } from "src/core";

export interface IClass {
  readonly id: string;
  name: string;
  code: string;
  description?: string;
  accessToken: string;
  isActive: boolean;
  organizationId: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IClassCreate = Pick<
  IClass,
  "name" | "description" | "organizationId" | "userId"
> & {
  numberOfStudents: number;
  studentEmails: string;
};

export interface ClassCreatedPayload {
  id: string;
  name: string;
  code: string;
  description?: string;
  organizationId: string;
  userId: string;
  userEmail: string;
}

export type IClassCreatedEvent = IDomainEvent<ClassCreatedPayload>;