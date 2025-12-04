import { randomUUID, randomBytes } from "crypto";

import { DomainError, ErrorCode } from "src/core";
import { IVerificationToken, VerificationTokenType } from "../types";
import { DateUtils } from "src/utils/date.utils";
import { GeneralUtils } from "src/utils/general.utils";

export class VerificationTokenEntity {
  private props: IVerificationToken;

  private constructor(props: IVerificationToken) {
    this.props = props;
  }

  static create(
    email: string,
    type: VerificationTokenType
  ): VerificationTokenEntity {
    const now = new Date();

    return new VerificationTokenEntity({
      id: randomUUID(),
      email,
      type,
      token: GeneralUtils.generateToken(32),
      expiresAt: DateUtils.addHours(new Date(), 24),
      isUsed: false,
      usedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  isValid(): boolean {
    return !this.isExpired() && !this.props.isUsed;
  }

  markAsUsed(): void {
    if (this.props.isUsed) {
      throw new DomainError(ErrorCode.TOKEN_ALREADY_USED, "Token already used");
    }

    this.props = {
      ...this.props,
      isUsed: true,
      usedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  get email(): string {
    return this.props.email;
  }

  get token(): string {
    return this.props.token;
  }

  get type(): string {
    return this.props.type;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get isUsed(): boolean {
    return this.props.isUsed;
  }

  get usedAt(): Date | null {
    return this.props.usedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toPersistence(): IVerificationToken {
    return { ...this.props };
  }

  static reconstitute(data: IVerificationToken): VerificationTokenEntity {
    return new VerificationTokenEntity(data);
  }
}
