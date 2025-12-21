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
  status: "active" | "archived";
  archivedAt: Date | null;
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

export interface ClassArchivedPayload {
  id: string;
  name: string;
  code: string;
  description: string | null;
  organizationId: string;
  userId: string;
  userEmail: string;
}

export type IClassArchivedEvent = IDomainEvent<ClassArchivedPayload>;

export interface IClassStudent {
  readonly id: string;
  classId: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IClassStudentCreate = Omit<IClassStudent, "id" | "createdAt" | "updatedAt">;

// Use-case Input/Output types
export interface CreateClassInput extends IClassCreate {
  userEmail: string;
}

export interface GetClassesByOrganizationInput {
  organizationId: string;
  userId: string;
  archived?: boolean;
}

export interface ClassListItemResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  student_count: number;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  archivedAt: string | null;
  students: Array<{
    id: string;
    email: string;
  }>;
  subjects: Array<never>; // Empty array for list view
}

export interface GetClassByIdInput {
  classId: string;
  organizationId: string;
  userId: string;
}

export interface ClassDetailResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  student_count: number;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  students: Array<{
    id: string;
    email: string;
  }>;
}

export interface UpdateClassInput {
  classId: string;
  organizationId: string;
  userId: string;
  name?: string;
  description?: string | null;
  numberOfStudents?: number;
  studentEmails?: string;
}

export interface ArchiveClassInput {
  classId: string;
  organizationId: string;
  userId: string;
  userEmail: string;
}