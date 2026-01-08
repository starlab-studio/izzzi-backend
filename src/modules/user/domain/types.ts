import { IUser } from "../../organization/domain/types";

export interface GetProfileInput {
  userId: string;
}

export type GetProfileOutput = IUser;

export interface UpdateProfileInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  organizationId?: string;
  organizationName?: string;
}

export interface DeleteAccountInput {
  userId: string;
}

export interface UpdateAvatarInput {
  userId: string;
  avatarUrl: string;
}

export type UpdateAvatarOutput = IUser;

export type UpdateProfileOutput = IUser;
