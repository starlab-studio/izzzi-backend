import { DomainError, ErrorCode } from "src/core";
import { IAuthIdentityRepository } from "../repositories/authIdentity.repository";

export class AuthIdentityUniquenessService {
  constructor(private readonly repository: IAuthIdentityRepository) {}

  async ensureEmailIsUnique(username: string): Promise<void> {
    const existingAuthIdentity = await this.repository.findByUsername(username);
    if (existingAuthIdentity) {
      throw new DomainError(
        ErrorCode.EMAIL_ALREADY_EXISTS,
        "This email is already registered",
      );
    }
  }
}
