import { randomUUID } from "crypto";

import { IRefreshToken, AuthIdentityName } from "../types";

export class RefreshToken {
  private props: IRefreshToken;

  private constructor(props: IRefreshToken) {
    this.props = props;
  }

  static create(
    tokenHash: string,
    userId: string,
    expiresAt: Date,
    provider?: AuthIdentityName,
    deviceInfo?: string,
    ipAddress?: string
  ): RefreshToken {
    const now = new Date();

    const token = new RefreshToken({
      id: randomUUID(),
      tokenHash,
      userId,
      provider,
      deviceInfo,
      ipAddress,
      isRevoked: false,
      expiresAt,
      createdAt: now,
      updatedAt: now,
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
      updatedAt: new Date(),
    };
  }

  matchesDevice(deviceInfo: string): boolean {
    if (!this.props.deviceInfo) {
      return true;
    }

    if (!deviceInfo) {
      return !this.props.deviceInfo;
    }

    const normalize = (ua: string): string => {
      const browserMatch = ua.match(
        /(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)/i
      );
      const browser = browserMatch ? browserMatch[1].toLowerCase() : "";

      const osMatch = ua.match(/(Windows|Mac|Linux|Android|iOS|iPhone|iPad)/i);
      const os = osMatch ? osMatch[1].toLowerCase() : "";

      return `${browser}-${os}`;
    };

    const normalizedStored = normalize(this.props.deviceInfo);
    const normalizedProvided = normalize(deviceInfo);

    return normalizedStored === normalizedProvided;
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
  get provider(): AuthIdentityName | undefined {
    return this.props.provider;
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
