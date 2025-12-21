import { randomUUID } from "crypto";

import { IPasswordResetToken } from "../types";

export class PasswordResetToken {
  private props: IPasswordResetToken;

  private constructor(props: IPasswordResetToken) {
    this.props = props;
  }

  static create(
    tokenHash: string,
    userId: string,
    email: string,
    expiresAt: Date
  ): PasswordResetToken {
    const now = new Date();

    const token = new PasswordResetToken({
      id: randomUUID(),
      tokenHash,
      userId,
      email,
      expiresAt,
      isUsed: false,
      createdAt: now,
      updatedAt: now,
    });

    return token;
  }

  isValid(): boolean {
    if (this.props.isUsed) {
      return false;
    }

    if (this.isExpired()) {
      return false;
    }

    return true;
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  markAsUsed(): void {
    if (this.props.isUsed) {
      throw new Error("Token already used");
    }

    this.props = {
      ...this.props,
      isUsed: true,
      usedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  get id(): string {
    return this.props.id;
  }

  get tokenHash(): string {
    return this.props.tokenHash;
  }

  get userId(): string {
    return this.props.userId;
  }

  get email(): string {
    return this.props.email;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get isUsed(): boolean {
    return this.props.isUsed;
  }

  get usedAt(): Date | undefined {
    return this.props.usedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toPersistence(): IPasswordResetToken {
    return { ...this.props };
  }

  static reconstitute(props: IPasswordResetToken): PasswordResetToken {
    return new PasswordResetToken(props);
  }
}
