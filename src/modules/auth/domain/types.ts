import { IDomainEvent } from "src/core";

export interface IAuthIdentity {
  readonly id: string;
  readonly provider: AuthIdentityName;
  readonly providerUserId: string;
  readonly username: string;
  readonly password?: string;
  readonly userId?: string;
  readonly failedLoginAttempts: number;
  readonly lastFailedLoginAt: Date | null;
  readonly lockedUntil: Date | null;
  readonly isLocked: boolean;
  readonly isEmailVerified: boolean;
  readonly emailVerifiedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
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
  verificationToken: string;
  sendVerificationToken: boolean;
};

export type SignInData = {
  email: string;
  password: string;
};

export type SignInResponse = {
  accessToken: string;
  refreshToken: string;
};

export enum AuthIdentityName {
  CUSTOM = "CUSTOM",
  AWS_COGNITO = "AWS_COGNITO",
  SUPABASE = "SUPABASE",
  FIREBASE = "FIREBASE",
}

export type IAuthIdentityCreate = SignUpResponse;

export const AUTH_STRATEGY_TOKEN = Symbol("AUTH_STRATEGY");

export interface IAuthStrategy {
  readonly name: AuthIdentityName;
  signUp(data: SignUpData): Promise<SignUpResponse>;

  signIn(data: { email: string; password: string }): Promise<SignInResponse>;

  confirmSignUp(data: ConfirmSignUpData): Promise<boolean>;

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

  refreshToken(data: RefreshTokenData): Promise<SignInResponse>;

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

export interface UserFailedPayload {
  username: string;
  authIdentityId: string;
}
export type IUserFailedEvent = IDomainEvent<UserFailedPayload>;

export interface SignUpSucceedPayload {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  verificationLink: string;
  sendVerificationToken: boolean;
}
export type ISignUpSucceedEvent = IDomainEvent<SignUpSucceedPayload>;

export enum VerificationTokenType {
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
  PHONE_VERIFICATION = "PHONE_VERIFICATION",
  TWO_FACTOR_AUTH = "TWO_FACTOR_AUTH",
  MAGIC_LINK = "MAGIC_LINK",
}

export interface IVerificationToken {
  readonly id: string;
  readonly email: string;
  readonly token: string;
  readonly type: VerificationTokenType;
  readonly expiresAt: Date;
  readonly isUsed: boolean;
  readonly usedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ConfirmSignUpData {
  token: string;
}

export interface IRefreshToken {
  readonly id: string;
  readonly tokenHash: string;
  readonly userId: string;
  readonly deviceInfo?: string;
  readonly ipAddress?: string;
  readonly isRevoked: boolean;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly revokedAt?: Date;
  readonly lastUsedAt?: Date;
}

export interface RefreshTokenCreatedPayload {
  tokenId: string;
  userId: string;
  deviceInfo?: string;
}
export type IRefreshTokenCreatedEvent =
  IDomainEvent<RefreshTokenCreatedPayload>;

export interface RefreshTokenRevokedPayload {
  tokenId: string;
  userId: string;
}

export type IRefreshTokenRevokedEvent =
  IDomainEvent<RefreshTokenRevokedPayload>;

export type RefreshTokenData = {
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
};
