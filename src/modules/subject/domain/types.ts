import { IDomainEvent } from "src/core";

export interface ISubject {
  readonly id: string;
  name: string;
  isActive: boolean;
  instructorName: string | null;
  instructorEmail: string | null;
  firstCourseDate: Date | null;
  lastCourseDate: Date | null;
  organizationId: string;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type ISubjectCreate = Pick<
  ISubject,
  "name" | "organizationId" | "createdBy"
> & {
  instructorName?: string | null;
  instructorEmail?: string | null;
  firstCourseDate?: Date | null;
  lastCourseDate?: Date | null;
};

export interface SubjectCreatedPayload {
  id: string;
  name: string;
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

export type ISubjectUpdate = Partial<
  Pick<
    ISubject,
    | "name"
    | "instructorName"
    | "instructorEmail"
    | "firstCourseDate"
    | "lastCourseDate"
  >
>;

export interface CreateSubjectInput {
  classId: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  name: string;
  instructorName?: string | null;
  instructorEmail?: string | null;
  firstCourseDate?: string | null; // ISO date string (YYYY-MM-DD)
  lastCourseDate?: string | null; // ISO date string (YYYY-MM-DD)
}

export interface CreateSubjectOutput {
  subjectId: string;
  assignmentId: string;
  subject: ISubject;
}

export interface UpdateSubjectInput {
  subjectId: string;
  organizationId: string;
  userId: string;
  name?: string;
  instructorName?: string | null;
  instructorEmail?: string | null;
  firstCourseDate?: string | null; // ISO date string (YYYY-MM-DD)
  lastCourseDate?: string | null; // ISO date string (YYYY-MM-DD)
}

export interface UpdateSubjectOutput {
  subject: ISubject;
}

export interface GetSubjectsByClassInput {
  classId: string;
  organizationId: string;
  userId: string;
}

export interface ClassSubjectDetailsResponse {
  id: string;
  name: string;
  instructorName: string | null;
  instructorEmail: string | null;
  firstCourseDate: string | null;
  lastCourseDate: string | null;
  formType: {
    id: string;
    name: string;
    description?: string;
  } | null;
  feedbackMoments: Array<{
    id: string;
    type: "during" | "end";
    label: string;
    icon: "clock" | "check";
    formLink: string;
    qrCodeUrl?: string;
    feedbackStats: {
      received: number;
      total: number;
      visible?: number;
      hidden?: number;
    };
    canEdit: boolean;
    lastReminderSent?: string | null;
  }>;
}

export interface GetSubjectsByClassOutput {
  subjects: ClassSubjectDetailsResponse[];
}

export interface DeleteSubjectInput {
  subjectId: string;
  organizationId: string;
  userId: string;
}

export interface BulkCreateSubjectsInput {
  classId: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  subjects: CreateSubjectInput[];
}

export interface BulkCreateSubjectsOutput {
  success: boolean;
  createdCount: number;
  errors: Array<{ row: number; error: string }>;
  subjects: ISubject[];
}
