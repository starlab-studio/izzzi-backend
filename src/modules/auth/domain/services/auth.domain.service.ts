import { DomainError } from "src/core";
import { SignUpData, SignUpResponse } from "../types";

export class AuthDomainService {
  validateSignUpData(data: SignUpData): void {
    if (!data.email || !data.password) {
      throw new DomainError("Email and password are required");
    }
  }

  validateSignUpResponse(response: SignUpResponse): void {
    if (!response || !response.provider || !response.provider_user_id) {
      throw new DomainError("Invalid signup response from provider");
    }
  }

  canCreateAuthIdentity({
    provider,
    provider_user_id,
  }: {
    provider: string;
    provider_user_id: string;
  }): void {
    if (!provider || !provider_user_id) {
      throw new DomainError("Invalid data for creating auth identity");
    }
  }
}
