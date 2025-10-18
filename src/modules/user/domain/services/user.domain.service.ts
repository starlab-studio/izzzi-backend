import { DomainError } from "src/core";
import { IUser, UserStatus } from "../types";

export class UserDomainService {
  validateUserUniqueness(existingUser: IUser | null): void {
    if (existingUser) {
      throw new DomainError("Invalid data for creating auth identity");
    }
  }

  validateUserStatus(user: IUser, requiredStatus?: UserStatus): void {
    if (!user) {
      throw new DomainError("User not found");
    }

    if (requiredStatus && user.status !== requiredStatus) {
      throw new DomainError(
        `User must be ${requiredStatus} to perform this action`
      );
    }
  }

  canUserPerformAction(user: IUser): boolean {
    if (user.status === UserStatus.DISABLED) {
      throw new DomainError("User account is disabled");
    }

    if (user.status === UserStatus.FAILED) {
      throw new DomainError("User account has failed status");
    }

    if (user.status === UserStatus.PENDING) {
      throw new DomainError("User account is pending activation");
    }

    return true;
  }

  canActivateUser(user: IUser): boolean {
    if (user.status !== UserStatus.PENDING) {
      throw new DomainError("Only pending users can be activated");
    }
    return true;
  }

  canUserLogin(user: IUser): boolean {
    this.validateUserStatus(user, UserStatus.ACTIVE);
    this.canUserPerformAction(user);
    return true;
  }
}
