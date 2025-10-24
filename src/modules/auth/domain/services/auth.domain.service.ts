import { DomainError, ErrorCode } from "src/core";
import { SignUpData, SignUpResponse } from "../types";

export class AuthDomainService {
  validateSignUpData(data: SignUpData): void {
    if (!data.email || !data.password) {
      throw new DomainError(
        ErrorCode.EMAIL_AND_PASSWORD_REQUIRED,
        "Email and password are required"
      );
    }
  }

  validateSignUpResponse(response: SignUpResponse): void {
    if (!response || !response.provider || !response.providerUserId) {
      throw new DomainError(
        ErrorCode.INVALID_SIGNUP_RESPONSE,
        "Invalid signup response from provider"
      );
    }
  }

  canCreateAuthIdentity({
    provider,
    providerUserId,
  }: {
    provider: string;
    providerUserId: string;
  }): void {
    if (!provider || !providerUserId) {
      throw new DomainError(
        ErrorCode.INVALID_AUTH_DATA,
        "Invalid data for creating auth identity"
      );
    }
  }
}
