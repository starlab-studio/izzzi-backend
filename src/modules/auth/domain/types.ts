export interface IAuthIdentity {
  id?: string;
  provider: string;
  provider_user_id: string;
  user_id: string | null;
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
  provider: string;
  provider_user_id: string;
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
  | "BASIC"
  | "AWS_COGNITO"
  | "SUPABASE"
  | "FIREBASE";

export type IAuthIdentityCreate = SignUpResponse;

export interface IAuthStrategy {
  name: AuthIdentityName;
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
}
