import { DomainError, ErrorCode } from "src/core";
import { IUser, UserStatus } from "../types";

export class UserDomainService {
  validateUserUniqueness(existingUser: IUser | null): void {
    if (existingUser) {
      throw new DomainError(
        ErrorCode.EMAIL_ALREADY_EXISTS,
        "Email already exists"
      );
    }
  }

  validateUserStatus(user: IUser, requiredStatus?: UserStatus): void {
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    if (requiredStatus && user.status !== requiredStatus) {
      throw new DomainError(
        ErrorCode.USER_ACCOUNT_STATUS_IS_INVALID,
        `User must be ${requiredStatus} to perform this action`
      );
    }
  }

  canUserPerformAction(user: IUser): boolean {
    if (user.status === UserStatus.DISABLED) {
      throw new DomainError(
        ErrorCode.USER_ACCOUNT_DISABLED,
        "User account is disabled"
      );
    }

    if (user.status === UserStatus.FAILED) {
      throw new DomainError(
        ErrorCode.USER_ACCOUNT_FAILED,
        "User account has failed status"
      );
    }

    if (user.status === UserStatus.PENDING) {
      throw new DomainError(
        ErrorCode.USER_ACCOUNT_PENDING,
        "User account is pending activation"
      );
    }

    return true;
  }

  canActivateUser(user: IUser): boolean {
    if (user.status !== UserStatus.PENDING) {
      throw new DomainError(
        ErrorCode.ONLY_PENDING_USERS_CAN_BE_ACTIVATED,
        "Only pending users can be activated"
      );
    }
    return true;
  }

  canUserLogin(user: IUser): boolean {
    this.validateUserStatus(user, UserStatus.ACTIVE);
    this.canUserPerformAction(user);
    return true;
  }
}
