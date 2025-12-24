import { IDomainEvent, UserRole } from "src/core";
import { MembershipEntity } from "./entities/membership.entity";
import { OrganizationEntity } from "./entities/organization.entity";

export enum UserStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  DELETED = "deleted",
}

export enum GlobalRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  PLATFORM_ADMIN = "PLATFORM_ADMIN",
}

export interface IUser {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phoneNumber: string | null;
  readonly avatarUrl: string | null;
  readonly lastLogin: Date | null;
  readonly status: UserStatus;
  readonly role: GlobalRole | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type IUserCreate = Pick<IUser, "firstName" | "lastName" | "email"> & {
  organization: string;
  authIdentityId: string;
};

export interface IUserReconstitute extends IUser {
  readonly memberships?: MembershipEntity[];
}

export type UserCreatedPayload = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  verificationLink: string;
};
export type IUserCreatedEvent = IDomainEvent<UserCreatedPayload>;

export type UserFailedPayload = { username: string; authIdentityId: string };
export type IUserFailedEvent = IDomainEvent<UserFailedPayload>;

export interface IOrganization {
  readonly id: string;
  readonly name: string;
  readonly siren: string | null;
  readonly siret: string | null;
  readonly vatNumber: string | null;
  readonly slug: string;
  readonly ownerId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type IOrganizationCreate = Pick<IOrganization, "name" | "ownerId">;

export interface IOrganizationReconstitute extends IOrganization {
  readonly memberships?: MembershipEntity[];
}

export enum MembershipStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  DELETED = "deleted",
}
export interface IMembership {
  readonly id: string;
  readonly userId: string;
  readonly organizationId: string;
  readonly role: UserRole;
  readonly addedBy: string | null;
  readonly status: MembershipStatus;
  readonly leftAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type MembershipWithOrganizationData = {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  status: MembershipStatus;
  addedBy: string | null;
  leftAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  organization: IOrganization;
};

export interface IMembershipReconstitute extends IMembership {
  organization?: OrganizationEntity;
  user?: IUser;
}

export type IMembershipCreate = Pick<
  IMembership,
  "userId" | "organizationId" | "role" | "addedBy"
>;

export type UserCreatedEvent = IDomainEvent<UserCreatedPayload>;

export enum InvitationStatus {
  PENDING = "pending",
  ACCEPDED = "accepted",
  EXPIRED = "expired",
  REVOKED = "revoked",
}

export interface IInvitation {
  readonly id: string;
  readonly email: string;
  readonly organizationId: string;
  readonly invitedBy: string;
  readonly role: UserRole;
  readonly token: string;
  readonly status: InvitationStatus;
  readonly expiresAt: Date;
  readonly acceptedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type IInvitationCreate = Pick<
  IInvitation,
  "email" | "organizationId" | "invitedBy" | "role"
>;

export type InvitationSentPayload = {
  email: string;
  organizationName: string;
  inviterName: string;
  invitationLink: string;
  role: UserRole;
};
export type IInvitationSentEvent = IDomainEvent<InvitationSentPayload>;

export type InvitationAcceptedPayload = {
  userId: string;
  organizationId: string;
  email: string;
  firstName?: string; // Optional, present when user signs up from invitation
};
export type IInvitationAcceptedEvent = IDomainEvent<InvitationAcceptedPayload>;
