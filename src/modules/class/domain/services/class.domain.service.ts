import { DomainError } from "src/core";
import { ErrorCode } from "src/core/domain/errors/code.error";
import { UserRole } from "src/core/domain/types";
import { IClass } from "../types";
import { IMembership } from "src/modules/organization/domain/types";

export class ClassDomainService {
  validateClassUniqueness(existingClass: IClass | null): void {
    if (existingClass) {
      throw new DomainError(
        ErrorCode.CLASS_ALREADY_EXISTS,
        "A class with this name already exists in this organization",
      );
    }
  }

  validateUserCanCreateClass(membership: IMembership | null): void {
    if (!membership) {
      throw new DomainError(
        ErrorCode.USER_HAS_NO_ORGANIZATION,
        "User is not a member of this organization",
      );
    }

    if (
      membership.role !== UserRole.LEARNING_MANAGER &&
      membership.role !== UserRole.ADMIN
    ) {
      throw new DomainError(
        ErrorCode.UNAUTHORIZED_ROLE,
        "User must have LEARNING_MANAGER or ADMIN role to create a class",
      );
    }
  }
}
