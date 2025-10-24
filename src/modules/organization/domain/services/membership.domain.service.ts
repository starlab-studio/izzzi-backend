import { DomainError, ErrorCode } from "src/core";
import { IUser, IMembership, UserStatus } from "../types";

export class MembershipDomainService {
  validateMembershipUniqueness(membership: IMembership | null): void {
    if (membership) {
      throw new DomainError(
        ErrorCode.USER_ORGANIZATION_ALREADY_EXISTS,
        "User is already associated with this organization"
      );
    }
  }
  validateUserStatus(user: IUser): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new DomainError(
        ErrorCode.USER_MUST_BE_ACTIVE,
        "User must be active to be associated with an organization"
      );
    }
  }
}
