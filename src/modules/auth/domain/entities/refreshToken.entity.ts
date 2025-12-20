import { randomUUID } from "crypto";

import { IRefreshToken } from "../types";

export class RefreshToken {
  private props: IRefreshToken;

  private constructor(props: IRefreshToken) {
    this.props = props;
  }

  static create(
    tokenHash: string,
    userId: string,
    expiresAt: Date,
    deviceInfo?: string,
    ipAddress?: string
  ): RefreshToken {
    const token = new RefreshToken({
      id: randomUUID(),
      tokenHash,
      userId,
      deviceInfo,
      ipAddress,
      isRevoked: false,
      expiresAt,
      createdAt: new Date(),
    });

    return token;
  }

  isValid(): boolean {
    if (this.props.isRevoked) {
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

  revoke(): void {
    if (this.props.isRevoked) {
      throw new Error("Token already revoked");
    }

    this.props = {
      ...this.props,
      isRevoked: true,
      revokedAt: new Date(),
    };
  }

  matchesDevice(deviceInfo: string): boolean {
    if (!this.props.deviceInfo) {
      return true;
    }
    return this.props.deviceInfo === deviceInfo;
  }

  isNearExpiration(hoursBeforeExpiration: number = 24): boolean {
    const now = new Date();
    const timeUntilExpiration = this.props.expiresAt.getTime() - now.getTime();
    const hoursUntilExpiration = timeUntilExpiration / (1000 * 60 * 60);
    return hoursUntilExpiration < hoursBeforeExpiration;
  }

  recordUsage(): void {
    this.props = {
      ...this.props,
      lastUsedAt: new Date(),
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
  get deviceInfo(): string | undefined {
    return this.props.deviceInfo;
  }
  get ipAddress(): string | undefined {
    return this.props.ipAddress;
  }
  get isRevoked(): boolean {
    return this.props.isRevoked;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get revokedAt(): Date | undefined {
    return this.props.revokedAt;
  }
  get lastUsedAt(): Date | undefined {
    return this.props.lastUsedAt;
  }

  toPersistence(): IRefreshToken {
    return { ...this.props };
  }

  static reconstitute(props: IRefreshToken): RefreshToken {
    return new RefreshToken(props);
  }
}
