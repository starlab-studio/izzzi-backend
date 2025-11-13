import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import * as jwt from "jsonwebtoken";
import { JwtService } from "@nestjs/jwt";

import {
  IAuthStrategy,
  SignInResponse,
  SignUpData,
  SignUpResponse,
} from "../../domain/types";

import { AuthIdentityName } from "../../domain/types";
import { DomainError, ErrorCode } from "src/core";
import type { IAuthIdentityRepository } from "../../domain/repositories/authIdentity.repository";
import { Role } from "src/modules/organization";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { AuthIdentityEntity } from "../../domain/entities/authIdentity.entity";

export type JWTPayload = {
  sub: string;
  username: string;
  roles: { organizationId: string; role: Role }[];
};

@Injectable()
export class CustomAuthAdapter implements IAuthStrategy {
  readonly name: AuthIdentityName = "CUSTOM";

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly organizationFacade: OrganizationFacade
  ) {}

  async signUp(data: SignUpData): Promise<SignUpResponse> {
    const providerUserId = this.generateUserId(data.email);
    const hashedPassword = await this.hashPassword(data.password);

    const existingIdentity =
      await this.authIdentityRepository.findByProviderAndUsername(
        this.name,
        data.email
      );
    if (existingIdentity) {
      throw new DomainError(
        ErrorCode.USER_ALREADY_EXISTS,
        "User already exists with this email"
      );
    }

    const authIdentity = new AuthIdentityEntity({
      provider: this.name,
      providerUserId,
      password: hashedPassword,
      username: data.email,
    });
    const ormAuthIdentity =
      await this.authIdentityRepository.create(authIdentity);

    const { password, ...userData } = data;
    return { ...userData, authIdentityId: ormAuthIdentity.id };
  }

  async signIn(data: {
    email: string;
    password: string;
  }): Promise<SignInResponse> {
    const identity =
      await this.authIdentityRepository.findByProviderAndUsername(
        this.name,
        data.email
      );
    if (!identity)
      throw new DomainError(
        ErrorCode.INVALID_AUTH_DATA,
        "Invalid email or password"
      );

    const isAuthorized = await this.verifyPassword(
      identity.password as string,
      data.password
    );
    if (!isAuthorized)
      throw new DomainError(
        ErrorCode.INVALID_AUTH_DATA,
        "Invalid email or password"
      );

    const userDetails = await this.organizationFacade.getUserProfile(
      identity.userId as string
    );

    const payload: JWTPayload = {
      sub: identity.providerUserId,
      username: userDetails.email,
      roles: userDetails.roles,
    };

    const accessToken = await this.jwtService.signAsync<JWTPayload>(payload, {
      secret: this.configService.get<string>("auth.jwt.secret"),
      expiresIn: (this.configService.get<string>("auth.jwt.expiresIn") ??
        "15m") as jwt.SignOptions["expiresIn"],
    });

    const refreshToken = await this.jwtService.signAsync<{ sub: string }>(
      { sub: payload.sub },
      {
        secret: this.configService.get<string>("auth.jwt.refreshSecret"),
        expiresIn: (this.configService.get<string>(
          "auth.jwt.refreshExpiresIn"
        ) ?? "7d") as jwt.SignOptions["expiresIn"],
      }
    );

    return { accessToken, refreshToken };
  }

  async confirmSignUp(data: { email: string; code: string }): Promise<Boolean> {
    return true;
  }

  async resendConfirmationCode(data: { email: string }): Promise<void> {}

  async forgotPassword(data: { email: string }): Promise<void> {}

  async confirmForgotPassword(data: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<void> {}

  async changePassword(data: {
    accessToken: string;
    oldPassword: string;
    newPassword: string;
  }): Promise<void> {}

  async deleteIdentity(username: string): Promise<void> {
    await this.authIdentityRepository.deleteByUsername(username);
  }

  private generateUserId(username: string): string {
    return `custom:${Date.now()}:${username}`;
  }

  private async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
      hashLength: 32,
    });
  }

  private async verifyPassword(
    hash: string,
    password: string
  ): Promise<boolean> {
    return await argon2.verify(hash, password);
  }
}
