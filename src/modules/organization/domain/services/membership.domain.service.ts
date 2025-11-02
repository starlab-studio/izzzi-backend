import { DomainError, ErrorCode } from "src/core";
import { IUser, IMembership, UserStatus } from "../types";

export class MembershipDomainService {
  validateMembershipExsits(memberships: IMembership[] | null | undefined) {
    if (!memberships || memberships.length === 0) {
      throw new DomainError(
        ErrorCode.USER_HAS_NO_ORGANIZATION,
        "User has no organization"
      );
    }
  }

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
