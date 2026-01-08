export enum ContactRequestStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  ARCHIVED = "archived",
}

export interface IContactRequest {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly organizationName: string | null;
  readonly numberOfClasses: number | null;
  readonly message: string;
  readonly status: ContactRequestStatus;
  readonly notes: string | null;
  readonly processedBy: string | null;
  readonly processedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type IContactRequestCreate = Pick<
  IContactRequest,
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "organizationName"
  | "numberOfClasses"
  | "message"
>;

export interface IContactRequestUpdate {
  status?: ContactRequestStatus;
  notes?: string;
  processedBy?: string;
}
