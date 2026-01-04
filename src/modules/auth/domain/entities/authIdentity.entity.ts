import { randomUUID } from "crypto";
import { AuthIdentityName, IAuthIdentity } from "../types";
import { DomainError, ErrorCode } from "src/core";

export class AuthIdentityEntity {
  private props: IAuthIdentity;

  private constructor(props: IAuthIdentity) {
    this.props = props;
  }

  public static create(
    data: Pick<
      IAuthIdentity,
      "provider" | "providerUserId" | "username" | "password"
    >
  ): AuthIdentityEntity {
    return new AuthIdentityEntity({
      id: randomUUID(),
      ...data,
      failedLoginAttempts: 0,
      lastFailedLoginAt: null,
      lockedUntil: null,
      isLocked: false,
      isEmailVerified: false,
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  setUser(userId: string): void {
    this.props = {
      ...this.props,
      userId,
      updatedAt: new Date(),
    };
  }

  canChangePassword(provider: AuthIdentityName): boolean {
    return provider === AuthIdentityName.CUSTOM;
  }

  isGoogleProvider(): boolean {
    return this.props.provider === AuthIdentityName.GOOGLE;
  }

  changePassword(newHashedPassword: string): void {
    this.props = {
      ...this.props,
      password: newHashedPassword,
      updatedAt: new Date(),
    };
  }

  isAccountLocked(): boolean {
    if (!this.props.isLocked || !this.props.lockedUntil) {
      return false;
    }

    if (new Date() > this.props.lockedUntil) {
      this.unlockAccount();
      return false;
    }

    return true;
  }

  recordFailedLoginAttempt(maxAttempts: number = 5): void {
    this.props = {
      ...this.props,
      failedLoginAttempts: (this.props.failedLoginAttempts || 0) + 1,
      lastFailedLoginAt: new Date(),
      updatedAt: new Date(),
    };

    if (
      this.props.failedLoginAttempts &&
      this.props.failedLoginAttempts >= maxAttempts
    ) {
      this.lockAccount(30);
    }
  }

  resetFailedLoginAttempts(): void {
    this.props = {
      ...this.props,
      failedLoginAttempts: 0,
      lastFailedLoginAt: null,
      updatedAt: new Date(),
    };
  }

  lockAccount(durationMinutes: number): void {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + durationMinutes);

    this.props = {
      ...this.props,
      isLocked: true,
      lockedUntil: lockUntil,
      updatedAt: new Date(),
    };
  }

  verifyEmail(email: string): void {
    if (
      email.toLowerCase().trim() !== this.props.username?.toLowerCase().trim()
    ) {
      throw new DomainError(
        ErrorCode.INVALID_EMAIL,
        "Invalid email for email verification"
      );
    }

    this.props = {
      ...this.props,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  updateUsername(newUsername: string): void {
    this.props = {
      ...this.props,
      username: newUsername.trim(),
      isEmailVerified: false,
      emailVerifiedAt: null,
      updatedAt: new Date(),
    };
  }

  unlockAccount(): void {
    this.props = {
      ...this.props,
      isLocked: false,
      lockedUntil: null,
      updatedAt: new Date(),
    };
    this.resetFailedLoginAttempts();
  }

  get id(): string {
    return this.props.id;
  }
  get provider(): AuthIdentityName {
    return this.props.provider;
  }
  get providerUserId(): string {
    return this.props.providerUserId;
  }
  get username(): string | undefined {
    return this.props.username;
  }
  get password(): string | undefined {
    return this.props.password;
  }
  get userId(): string | undefined {
    return this.props.userId;
  }
  get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }
  get failedLoginAttempts(): number {
    return this.props.failedLoginAttempts || 0;
  }
  get lastFailedLoginAt(): Date | null {
    return this.props.lastFailedLoginAt;
  }
  get lockedUntil(): Date | null {
    return this.props.lockedUntil;
  }
  get isLocked(): boolean {
    return this.props.isLocked || false;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toPersistence(): IAuthIdentity {
    return { ...this.props };
  }

  static reconstitute(data: IAuthIdentity): AuthIdentityEntity {
    return new AuthIdentityEntity(data);
  }
}
