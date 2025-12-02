import { DomainError, ErrorCode } from "src/core";
import { SignUpData, SignUpResponse } from "../types";

export class AuthDomainService {
  validateSignUpResponse(response: SignUpResponse): void {
    if (!response) {
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
