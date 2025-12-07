import { IDomainEvent } from "src/core";

export interface ISubject {
  readonly id: string;
  name: string;
  description: string | null;
  color: string;
  isActive: boolean;
  organizationId: string;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type ISubjectCreate = Pick<
  ISubject,
  "name" | "description" | "color" | "organizationId" | "createdBy"
>;

export interface SubjectCreatedPayload {
  id: string;
  name: string;
  description: string | null;
  color: string;
  organizationId: string;
  createdBy: string;
  userEmail: string;
}

export type ISubjectCreatedEvent = IDomainEvent<SubjectCreatedPayload>;

export interface ISubjectAssignment {
  readonly subjectId: string;
  readonly classId: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
}

export type ISubjectAssignmentCreate = {
  subjectId: string;
  classId: string;
  orderIndex?: number;
};
