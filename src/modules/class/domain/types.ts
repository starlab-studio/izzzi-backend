import { IDomainEvent } from "src/core";

export interface IClass {
  readonly id: string;
  name: string;
  code: string;
  description: string | null;
  numberOfStudents: number;
  studentEmails: string[];
  accessToken: string;
  isActive: boolean;
  organizationId: string;
  userId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type IClassCreate = Pick<
  IClass,
  "name" | "organizationId" | "userId"
> & {
  description: string | null;
  numberOfStudents: number;
  studentEmails: string;
};

export interface ClassCreatedPayload {
  id: string;
  name: string;
  code: string;
  description: string | null;
  organizationId: string;
  userId: string;
  userEmail: string;
}

export type IClassCreatedEvent = IDomainEvent<ClassCreatedPayload>;