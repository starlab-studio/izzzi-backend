import { IDomainEvent } from "src/core";

export interface IAuthIdentity {
  readonly id: string;
  provider: string;
  providerUserId: string;
  username: string;
  password: string | null;
  userId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SignUpData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organization: string;
};

export type SignUpResponse = Omit<SignUpData, "password"> & {
  authIdentityId: string;
};

export type SignInData = {
  email: string;
  password: string;
};

export type SignInResponse = {
  accessToken: string;
  refreshToken: string;
};

export type AuthIdentityName =
  | "CUSTOM"
  | "AWS_COGNITO"
  | "SUPABASE"
  | "FIREBASE";

export type IAuthIdentityCreate = SignUpResponse;

export const AUTH_STRATEGY_TOKEN = Symbol("AUTH_STRATEGY");

export interface IAuthStrategy {
  readonly name: AuthIdentityName;
  signUp(data: SignUpData): Promise<SignUpResponse>;

  signIn(data: { email: string; password: string }): Promise<SignInResponse>;

  confirmSignUp(data: { email: string; code: string }): Promise<Boolean>;

  resendConfirmationCode(data: { email: string }): Promise<void>;

  forgotPassword(data: { email: string }): Promise<void>;

  confirmForgotPassword(data: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<void>;

  changePassword(data: {
    accessToken: string;
    oldPassword: string;
    newPassword: string;
  }): Promise<void>;

  deleteIdentity(username: string): Promise<void>;
}

export interface AuthIdentityCreatedPayload {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  id: string;
  provider: string;
  providerUserId: string;
}

export interface AuthIdentityFailedPayload {
  username: string;
}

export type IAuthIdentityCreatedEvent =
  IDomainEvent<AuthIdentityCreatedPayload>;
export type IAuthIdentityFailedEvent = IDomainEvent<AuthIdentityFailedPayload>;

export type UserFailedPayload = { username: string; authIdentityId: string };
export type IUserFailedEvent = IDomainEvent<UserFailedPayload>;
