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
  RefreshTokenData,
  ForgotPasswordData,
  ResetPasswordData,
} from "../../domain/types";

import { DateUtils } from "src/utils/date.utils";
import { GeneralUtils } from "src/utils/general.utils";
import { AuthIdentityName } from "../../domain/types";
import { DomainError, ErrorCode, Email, JWTPayload } from "src/core";
import type { IAuthIdentityRepository } from "../../domain/repositories/authIdentity.repository";
import type { IVerificationTokenRepository } from "../../domain/repositories/verificationToken.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { AuthIdentityEntity } from "../../domain/entities/authIdentity.entity";
import { VerificationTokenType } from "../../domain/types";
import { Password } from "../../domain/value-objects/password.vo";
import { VerificationTokenEntity } from "../../domain/entities/verificationToken.entity";
import { AuthIdentityUniquenessService } from "../../domain/services/authIdentity-uniqueness.service";
import { RefreshToken } from "../../domain/entities/refreshToken.entity";
import type { IRefreshTokenRepository } from "../../domain/repositories/refreshToken.repository";
import { PasswordResetToken } from "../../domain/entities/passwordResetToken.entity";
import type { IPasswordResetTokenRepository } from "../../domain/repositories/passwordResetToken.repository";
import { CreateEmailNotificationUseCase } from "src/modules/notification/application/use-cases/create-email-notification.use-case";

@Injectable()
export class CustomAuthAdapter implements IAuthStrategy {
  readonly name: AuthIdentityName = AuthIdentityName.CUSTOM;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly authIdentityUniquenessService: AuthIdentityUniquenessService,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly organizationFacade: OrganizationFacade,
    private readonly verificationTokenRepository: IVerificationTokenRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase
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
      sendVerificationToken: ormAuthIdentity.isEmailVerified,
    };
  }

  async signIn(data: {
    email: string;
    password: string;
    deviceInfo?: string;
    ipAddress?: string;
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
      authIdentityEntity.recordFailedLoginAttempt(5); // TODO définir max attempts en configs
      await this.authIdentityRepository.save(authIdentityEntity);

      // TODO: Remove hardcoded max try value
      throw new DomainError(
        ErrorCode.INCORRECT_PASSWORD,
        `Invalid email or password. ${5 - authIdentityEntity.failedLoginAttempts} attempts remaining.`
      );
    }

    authIdentityEntity.resetFailedLoginAttempts();
    await this.authIdentityRepository.save(authIdentityEntity);

    const userDetails = await this.organizationFacade.getUserProfile(
      authIdentityEntity.userId! // TODO: Check pour être sûr que userId exists
    );

    const payload: JWTPayload = {
      sub: authIdentityEntity.providerUserId,
      userId: authIdentityEntity.userId || userDetails.id,
      username: userDetails.email,
      roles: userDetails.memberships,
    };

    const accessToken = await this.jwtService.signAsync<JWTPayload>(payload, {
      secret: this.configService.get<string>("auth.jwt.secret"),
      expiresIn: (this.configService.get<string>("auth.jwt.expiresIn") ??
        "15m") as jwt.SignOptions["expiresIn"],
    });

    await this.cleanupOldTokensIfNeeded(
      authIdentityEntity.userId || userDetails.id
    );
    const refreshToken = GeneralUtils.generateToken(48);
    const refreshTokenHash = GeneralUtils.hashToken(refreshToken);
    const refreshTokenExpiresIn =
      this.configService.get<string>("auth.jwt.refreshExpiresIn") ?? "7d";

    const daysMatch = refreshTokenExpiresIn.match(/(\d+)d/);
    const days = daysMatch ? parseInt(daysMatch[1], 10) : 7;
    const expiresAt = DateUtils.addHours(new Date(), days * 24);

    const refreshTokenEntity = RefreshToken.create(
      refreshTokenHash,
      authIdentityEntity.userId || userDetails.id,
      expiresAt,
      data.deviceInfo,
      data.ipAddress
    );

    await this.refreshTokenRepository.save(refreshTokenEntity);

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

  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    const emailVO = Email.create(data.email);
    const email = emailVO.value;

    const authIdentityEntity =
      await this.authIdentityRepository.findByUsername(email);

    if (!authIdentityEntity || !authIdentityEntity.isEmailVerified) {
      return;
    }

    const existingToken =
      await this.passwordResetTokenRepository.findByEmailAndNotUsed(email);
    if (existingToken) {
      await this.passwordResetTokenRepository.delete(existingToken.id);
    }

    const resetToken = GeneralUtils.generateToken(48);
    const resetTokenHash = GeneralUtils.hashToken(resetToken);
    const expiresAt = DateUtils.addHours(new Date(), 1);

    const passwordResetTokenEntity = PasswordResetToken.create(
      resetTokenHash,
      authIdentityEntity.userId!,
      email,
      expiresAt
    );

    await this.passwordResetTokenRepository.save(passwordResetTokenEntity);

    const frontendUrl = this.configService.get<string>("frontend.url") || "";
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    const template = GeneralUtils.htmlTemplateReader("password-reset.html", {
      resetLink,
      email,
    });

    await this.createEmailNotificationUseCase.execute({
      subject: "Réinitialisation de votre mot de passe",
      template,
      target: email,
    });
  }

  async confirmForgotPassword(data: ResetPasswordData): Promise<void> {
    const { token, newPassword } = data;

    const tokenHash = GeneralUtils.hashToken(token);
    const passwordResetTokenEntity =
      await this.passwordResetTokenRepository.findByTokenHash(tokenHash);

    if (!passwordResetTokenEntity) {
      throw new DomainError(
        ErrorCode.INVALID_PASSWORD_RESET_TOKEN,
        "Invalid reset token"
      );
    }

    if (!passwordResetTokenEntity.isValid()) {
      if (passwordResetTokenEntity.isUsed) {
        throw new DomainError(
          ErrorCode.PASSWORD_RESET_TOKEN_ALREADY_USED,
          "Reset token has already been used"
        );
      }
      if (passwordResetTokenEntity.isExpired()) {
        throw new DomainError(
          ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED,
          "Reset token has expired"
        );
      }
      throw new DomainError(
        ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED,
        "Reset token is invalid"
      );
    }

    const authIdentityEntity = await this.authIdentityRepository.findByUsername(
      passwordResetTokenEntity.email
    );

    if (!authIdentityEntity) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    if (authIdentityEntity.userId !== passwordResetTokenEntity.userId) {
      throw new DomainError(
        ErrorCode.PASSWORD_RESET_TOKEN_USER_MISMATCH,
        "Token user mismatch"
      );
    }

    const passwordVO = await Password.create(newPassword);
    authIdentityEntity.changePassword(passwordVO.value);
    await this.authIdentityRepository.save(authIdentityEntity);

    passwordResetTokenEntity.markAsUsed();
    await this.passwordResetTokenRepository.save(passwordResetTokenEntity);

    await this.refreshTokenRepository.revokeAllByUserId(
      passwordResetTokenEntity.userId
    );
  }

  async changePassword(data: {
    userId: string;
    username: string;
    oldPassword: string;
    newPassword: string;
  }): Promise<void> {
    const authIdentityEntity =
      await this.authIdentityRepository.findByProviderAndUsername(
        this.name,
        data.username
      );

    if (!authIdentityEntity) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    if (authIdentityEntity.userId !== data.userId) {
      throw new DomainError(ErrorCode.USER_ID_MISMATCH, "User ID mismatch");
    }

    if (!authIdentityEntity.canChangePassword(this.name)) {
      throw new DomainError(
        ErrorCode.PASSWORD_CHANGE_NOT_ALLOWED,
        "Password change not allowed for this provider"
      );
    }

    if (!authIdentityEntity.password) {
      throw new DomainError(
        ErrorCode.NO_PASSWORD_SET,
        "No password set for this account"
      );
    }

    const oldPasswordVO = Password.fromHash(authIdentityEntity.password);
    const isOldPasswordValid = await oldPasswordVO.compare(data.oldPassword);

    if (!isOldPasswordValid) {
      throw new DomainError(
        ErrorCode.INCORRECT_CURRENT_PASSWORD,
        "Current password is incorrect"
      );
    }

    const newPasswordVO = await Password.create(data.newPassword);

    authIdentityEntity.changePassword(newPasswordVO.value);
    await this.authIdentityRepository.save(authIdentityEntity);

    if (authIdentityEntity.userId) {
      await this.refreshTokenRepository.revokeAllByUserId(
        authIdentityEntity.userId
      );
    }
  }

  async deleteIdentity(username: string): Promise<void> {
    await this.authIdentityRepository.deleteByUsername(username);
  }

  async refreshToken(data: RefreshTokenData): Promise<SignInResponse> {
    const refreshTokenHash = GeneralUtils.hashToken(data.refreshToken);

    const refreshTokenEntity =
      await this.refreshTokenRepository.findByTokenHash(refreshTokenHash);

    if (!refreshTokenEntity) {
      throw new DomainError(
        ErrorCode.INVALID_REFRESH_TOKEN,
        "Invalid refresh token"
      );
    }

    if (!refreshTokenEntity.isValid()) {
      throw new DomainError(
        ErrorCode.REFRESH_TOKEN_EXPIRED_OR_REVOKED,
        "Refresh token is expired or revoked"
      );
    }

    if (data.deviceInfo && !refreshTokenEntity.matchesDevice(data.deviceInfo)) {
      throw new DomainError(
        ErrorCode.DEVICE_MISMATCH,
        "Device mismatch detected"
      );
    }

    refreshTokenEntity.recordUsage();
    await this.refreshTokenRepository.save(refreshTokenEntity);

    const userDetails = await this.organizationFacade.getUserProfile(
      refreshTokenEntity.userId
    );

    const payload: JWTPayload = {
      sub: userDetails.id, // TODO: ajuster la logique pour retourner le bpn sub ici ou supprimer
      userId: refreshTokenEntity.userId,
      username: userDetails.email,
      roles: userDetails.memberships,
    };

    const accessToken = await this.jwtService.signAsync<JWTPayload>(payload, {
      secret: this.configService.get<string>("auth.jwt.secret"),
      expiresIn: (this.configService.get<string>("auth.jwt.expiresIn") ??
        "15m") as jwt.SignOptions["expiresIn"],
    });

    refreshTokenEntity.revoke();
    await this.refreshTokenRepository.save(refreshTokenEntity);

    await this.cleanupOldTokensIfNeeded(refreshTokenEntity.userId);

    const newRefreshToken = GeneralUtils.generateToken(48);
    const newRefreshTokenHash = GeneralUtils.hashToken(newRefreshToken);
    const refreshTokenExpiresIn =
      this.configService.get<string>("auth.jwt.refreshExpiresIn") ?? "7d";

    const daysMatch = refreshTokenExpiresIn.match(/(\d+)d/);
    const days = daysMatch ? parseInt(daysMatch[1], 10) : 7;
    const expiresAt = DateUtils.addHours(new Date(), days * 24);

    const newRefreshTokenEntity = RefreshToken.create(
      newRefreshTokenHash,
      refreshTokenEntity.userId,
      expiresAt,
      data.deviceInfo || refreshTokenEntity.deviceInfo,
      data.ipAddress || refreshTokenEntity.ipAddress
    );

    await this.refreshTokenRepository.save(newRefreshTokenEntity);

    return { accessToken, refreshToken: newRefreshToken };
  }

  private generateUserId(username: string): string {
    return `custom:${Date.now()}:${username}`;
  }

  private async cleanupOldTokensIfNeeded(userId: string): Promise<void> {
    const count = await this.refreshTokenRepository.countActiveByUserId(userId);
    const maxTokens = 5; // TODO : une logique pour récupérer ceci dynamique depuis config

    if (count >= maxTokens) {
      const tokens =
        await this.refreshTokenRepository.findActiveByUserId(userId);

      const sortedTokens = tokens.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      const tokensToRevoke = sortedTokens.slice(0, count - maxTokens + 1);
      for (const token of tokensToRevoke) {
        token.revoke();
        await this.refreshTokenRepository.save(token);
      }
    }
  }
}
