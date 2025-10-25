import { IDomainEvent } from "src/core";

export enum UserStatus {
  PENDING = "pending",
  ACTIVE = "active",
  FAILED = "failed",
  DISABLED = "disabled",
}

export interface IUser {
  readonly id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  lastLogin?: Date;
  status: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IUserCreate = Pick<IUser, "firstName" | "lastName" | "email"> & {
  organization: string;
  authIdentityId: string;
};

export type UserCreatedPayload = { id: string } & IUserCreate;
export type IUserCreatedEvent = IDomainEvent<UserCreatedPayload>;

export type UserFailedPayload = { username: string; authIdentityId: string };
export type IUserFailedEvent = IDomainEvent<UserFailedPayload>;

export enum Role {
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
  MEMBER = "member",
}

export interface IOrganization {
  readonly id: string;
  name: string;
  siren?: string | undefined;
  siret?: string | undefined;
  vatNumber?: string | undefined;
  slug: string;
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IOrganizationCreate = Pick<
  IOrganization,
  "name" | "slug" | "ownerId"
>;

export interface IMembership {
  readonly id: string;
  userId: string;
  organizationId: string;
  role: Role;
  addedBy: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IMembershipCreate = Pick<
  IMembership,
  "userId" | "organizationId" | "role" | "addedBy"
>;
