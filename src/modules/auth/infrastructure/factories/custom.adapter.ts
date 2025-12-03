import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { JwtService } from "@nestjs/jwt";

import {
  ConfirmSignUpData,
  IAuthStrategy,
  SignInResponse,
  SignUpData,
  SignUpResponse,
} from "../../domain/types";

import { GeneralUtils } from "src/utils/general.utils";
import { AuthIdentityName } from "../../domain/types";
import { DomainError, ErrorCode } from "src/core";
import type { IAuthIdentityRepository } from "../../domain/repositories/authIdentity.repository";
import type { IVerificationTokenRepository } from "../../domain/repositories/verificationToken.repository";
import { Role } from "src/modules/organization";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { AuthIdentityEntity } from "../../domain/entities/authIdentity.entity";
import { VerificationTokenType } from "../../domain/types";
import { Email } from "../../domain/value-objects/email.vo";
import { Password } from "../../domain/value-objects/password.vo";
import { VerificationTokenEntity } from "../../domain/entities/verificationToken.entity";
import { AuthIdentityUniquenessService } from "../../domain/services/authIdentity-uniqueness.service";

export type JWTPayload = {
  sub: string;
  username: string;
  roles: { organizationId: string; role: Role }[];
};

@Injectable()
export class CustomAuthAdapter implements IAuthStrategy {
  readonly name: AuthIdentityName = AuthIdentityName.CUSTOM;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly authIdentityUniquenessService: AuthIdentityUniquenessService,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly organizationFacade: OrganizationFacade,
    private readonly verificationTokenRepository: IVerificationTokenRepository
  ) {}

  async signUp(data: SignUpData): Promise<SignUpResponse> {
    const providerUserId = this.generateUserId(data.email);
    const emailVO = Email.create(data.email);
    const passwordVO = await Password.create(data.password);

    await this.authIdentityUniquenessService.ensureEmailIsUnique(emailVO.value);

    const authIdentityEntity = AuthIdentityEntity.create({
      provider: this.name,
      providerUserId,
      password: passwordVO.value,
      username: emailVO.value,
    });
    const ormAuthIdentity =
      await this.authIdentityRepository.create(authIdentityEntity);

    const token_type = VerificationTokenType.EMAIL_VERIFICATION;
    const verificationTokenEntity = VerificationTokenEntity.create(
      emailVO.value,
      token_type
    );
    const ormVerificationToken = await this.verificationTokenRepository.save(
      verificationTokenEntity
    );

    const { password, ...userData } = data;
    return {
      ...userData,
      authIdentityId: ormAuthIdentity.id,
      verificationToken: ormVerificationToken.token,
      sendVerificationToken: true,
    };
  }

  async signIn(data: {
    email: string;
    password: string;
  }): Promise<SignInResponse> {
    const authIdentityEntity =
      await this.authIdentityRepository.findByProviderAndUsername(
        this.name,
        data.email
      );
    if (!authIdentityEntity)
      throw new DomainError(
        ErrorCode.INVALID_CREADENTIALS,
        "Invalid credentials"
      );

    if (!authIdentityEntity.isEmailVerified) {
      throw new DomainError(
        ErrorCode.EMAIL_NOT_VERIFIED,
        `Please verify your email and try again.`
      );
    }

    if (authIdentityEntity.isAccountLocked()) {
      const lockUntil = authIdentityEntity.lockedUntil;
      const minutesRemaining = lockUntil
        ? Math.ceil((lockUntil.getTime() - Date.now()) / 60000)
        : 0;
      throw new DomainError(
        ErrorCode.ACCOUNT_LOCKED,
        `Account is locked due to too many failed login attempts. Try again in ${minutesRemaining} minutes.`
      );
    }

    const passwordVO = Password.fromHash(authIdentityEntity.password as string);
    const isAuthorized = await passwordVO.compare(data.password);

    if (!isAuthorized) {
      authIdentityEntity.recordFailedLoginAttempt(5);
      await this.authIdentityRepository.save(authIdentityEntity);

      // TODO: Remove hardcoded max try value
      throw new DomainError(
        ErrorCode.INVALID_AUTH_DATA,
        `Invalid email or password. ${5 - authIdentityEntity.failedLoginAttempts} attempts remaining.`
      );
    }

    authIdentityEntity.resetFailedLoginAttempts();
    await this.authIdentityRepository.save(authIdentityEntity);

    const userDetails = await this.organizationFacade.getUserProfile(
      authIdentityEntity.username!
    );

    const payload: JWTPayload = {
      sub: authIdentityEntity.providerUserId,
      username: userDetails.email,
      roles: userDetails.roles,
    };

    const accessToken = await this.jwtService.signAsync<JWTPayload>(payload, {
      secret: this.configService.get<string>("auth.jwt.secret"),
      expiresIn: (this.configService.get<string>("auth.jwt.expiresIn") ??
        "15m") as jwt.SignOptions["expiresIn"],
    });

    const refreshToken = GeneralUtils.generateToken(48);
    // TODO : Save the refresh token in database
    // await this.refreshTokenRepository.create({
    //   token: refreshTokenVO.value,
    //   userId: authIdentityEntity.providerUserId,
    //   expiresAt: refreshTokenVO.expiresAt,
    // });

    return { accessToken, refreshToken };
  }

  async confirmSignUp(data: ConfirmSignUpData): Promise<boolean> {
    const verificationToken =
      await this.verificationTokenRepository.findByToken(data.token);

    if (!verificationToken) {
      throw new DomainError(
        ErrorCode.INVALID_VERIFICATION_TOKEN,
        "Invalid verification token"
      );
    }

    if (new Date() > verificationToken.expiresAt || verificationToken.isUsed) {
      throw new DomainError(
        ErrorCode.VERIFICATION_TOKEN_EXPIRED,
        "Verification token has expired"
      );
    }

    const email = verificationToken.email;
    const authIdentityEntity =
      await this.authIdentityRepository.findByUsername(email);

    if (!authIdentityEntity) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    authIdentityEntity.verifyEmail(email);
    this.authIdentityRepository.save(authIdentityEntity);

    verificationToken.markAsUsed();
    await this.verificationTokenRepository.save(verificationToken);

    return true;
  }

  async resendConfirmationCode(data: { email: string }): Promise<void> {
    const email = Email.create(data.email).value;
    const authIdentity =
      await this.authIdentityRepository.findByUsername(email);

    if (!authIdentity || authIdentity.isEmailVerified) return;

    await this.verificationTokenRepository.deleteByEmailAndType(
      email,
      VerificationTokenType.EMAIL_VERIFICATION
    );

    const token_type = VerificationTokenType.EMAIL_VERIFICATION;
    const verificationTokenEntity = VerificationTokenEntity.create(
      email,
      token_type
    );
    const ormVerificationToken = await this.verificationTokenRepository.save(
      verificationTokenEntity
    );

    // TODO: Send email with code using notification service
    // ormVerificationToken.token to ormVerificationToken.email
  }

  async forgotPassword(data: { email: string }): Promise<void> {
    // TODO : Implement forgotPassword logic
  }

  async confirmForgotPassword(data: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<void> {
    //  TODO : Implement confirmForgotPassword logic
  }

  async changePassword(data: {
    accessToken: string;
    oldPassword: string;
    newPassword: string;
  }): Promise<void> {
    // TODO : Implement logic to change user password
  }

  async deleteIdentity(username: string): Promise<void> {
    // TODO: Implement logic to delete  identity
  }

  private generateUserId(username: string): string {
    return `custom:${Date.now()}:${username}`;
  }
}
