import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { OAuth2Client } from "google-auth-library";
import * as jwt from "jsonwebtoken";

import {
  IAuthStrategy,
  SignInResponse,
  SignUpData,
  SignUpResponse,
  RefreshTokenData,
  ForgotPasswordData,
  ResetPasswordData,
  AuthIdentityName,
  GoogleUserInfo,
  GoogleAuthResult,
  PendingTokenPayload,
} from "../../domain/types";

import { DateUtils } from "src/utils/date.utils";
import { GeneralUtils } from "src/utils/general.utils";
import { DomainError, ErrorCode, Email, JWTPayload } from "src/core";
import { UserStatus } from "src/modules/organization/domain/types";
import type { IAuthIdentityRepository } from "../../domain/repositories/authIdentity.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { AuthIdentityEntity } from "../../domain/entities/authIdentity.entity";
import { RefreshToken } from "../../domain/entities/refreshToken.entity";
import type { IRefreshTokenRepository } from "../../domain/repositories/refreshToken.repository";
import { CreateEmailNotificationUseCase } from "src/modules/notification/application/use-cases/create-email-notification.use-case";

@Injectable()
export class GoogleAuthAdapter implements IAuthStrategy {
  readonly name: AuthIdentityName = AuthIdentityName.GOOGLE;
  private readonly oauthClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly organizationFacade: OrganizationFacade,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase
  ) {
    const callbackUrl = this.configService.get<string>("google.callbackUrl");
    console.log(
      "[GoogleAuthAdapter] Initializing with callback URL:",
      callbackUrl
    );

    this.oauthClient = new OAuth2Client(
      this.configService.get<string>("google.clientId"),
      this.configService.get<string>("google.clientSecret"),
      callbackUrl
    );
  }

  // IAuthStrategy methods - Not supported for Google
  async signUp(data: SignUpData): Promise<SignUpResponse> {
    throw new DomainError(
      ErrorCode.METHOD_NOT_SUPPORTED,
      "Use Google OAuth flow instead of signUp"
    );
  }

  async signIn(data: {
    email: string;
    password: string;
  }): Promise<SignInResponse> {
    throw new DomainError(
      ErrorCode.METHOD_NOT_SUPPORTED,
      "Use Google OAuth flow instead of signIn"
    );
  }

  async confirmSignUp(data: { token: string }): Promise<boolean> {
    throw new DomainError(
      ErrorCode.METHOD_NOT_SUPPORTED,
      "Not supported for Google accounts"
    );
  }

  async resendConfirmationCode(data: { email: string }): Promise<void> {
    throw new DomainError(
      ErrorCode.METHOD_NOT_SUPPORTED,
      "Not supported for Google accounts"
    );
  }

  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    throw new DomainError(
      ErrorCode.PASSWORD_OPERATIONS_NOT_ALLOWED_FOR_GOOGLE,
      "Password operations are not allowed for Google accounts"
    );
  }

  async confirmForgotPassword(data: ResetPasswordData): Promise<void> {
    throw new DomainError(
      ErrorCode.PASSWORD_OPERATIONS_NOT_ALLOWED_FOR_GOOGLE,
      "Password operations are not allowed for Google accounts"
    );
  }

  async changePassword(data: {
    userId: string;
    username: string;
    oldPassword: string;
    newPassword: string;
  }): Promise<void> {
    throw new DomainError(
      ErrorCode.PASSWORD_OPERATIONS_NOT_ALLOWED_FOR_GOOGLE,
      "Password operations are not allowed for Google accounts"
    );
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

    if (userDetails.status === UserStatus.DELETED) {
      refreshTokenEntity.revoke();
      await this.refreshTokenRepository.save(refreshTokenEntity);
      throw new DomainError(
        ErrorCode.USER_ACCOUNT_DELETED,
        "This account has been deleted. Please contact support if you believe this is an error."
      );
    }

    if (userDetails.status === UserStatus.SUSPENDED) {
      throw new DomainError(
        ErrorCode.USER_ACCOUNT_DISABLED,
        "This account has been suspended. Please contact support for more information."
      );
    }

    if (!userDetails.memberships || userDetails.memberships.length === 0) {
      refreshTokenEntity.revoke();
      await this.refreshTokenRepository.save(refreshTokenEntity);
      throw new DomainError(
        ErrorCode.NO_MEMBERSHIPS_FOUND,
        "This account has no active organization memberships. Please contact support."
      );
    }

    const payload: JWTPayload = {
      sub: userDetails.id,
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

  async deleteIdentity(username: string): Promise<void> {
    await this.authIdentityRepository.deleteByUsername(username);
  }

  // Google-specific methods (not in IAuthStrategy)
  getAuthorizationUrl(state?: string): string {
    const authUrl = this.oauthClient.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      prompt: "consent",
      state: state,
    });

    // Extract redirect_uri from the generated URL for debugging
    const urlObj = new URL(authUrl);
    const redirectUri = urlObj.searchParams.get("redirect_uri");
    console.log(
      "[GoogleAuthAdapter] Generated authorization URL with redirect_uri:",
      redirectUri
    );

    return authUrl;
  }

  async handleCallback(
    code: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<GoogleAuthResult> {
    try {
      // Exchange code for tokens
      const { tokens } = await this.oauthClient.getToken(code);
      if (!tokens.access_token) {
        throw new DomainError(
          ErrorCode.GOOGLE_AUTH_FAILED,
          "Failed to get access token from Google"
        );
      }

      // Get user info from Google
      const userInfo = await this.getUserInfo(tokens.access_token);

      // Verify email is verified
      if (!userInfo.verified_email) {
        throw new DomainError(
          ErrorCode.GOOGLE_AUTH_FAILED,
          "Google email is not verified"
        );
      }

      // Check if Google identity already exists
      const existingGoogleIdentity =
        await this.authIdentityRepository.findByProviderAndProviderUserId(
          AuthIdentityName.GOOGLE,
          userInfo.id
        );

      if (existingGoogleIdentity) {
        // Google identity exists
        if (existingGoogleIdentity.userId) {
          // Already linked to a user - direct login
          return await this.generateTokensForUser(
            existingGoogleIdentity.userId,
            deviceInfo,
            ipAddress
          );
        } else {
          // Not linked yet - link it (shouldn't happen in normal flow)
          throw new DomainError(
            ErrorCode.UNEXPECTED_ERROR,
            "Google identity exists but is not linked to a user"
          );
        }
      }

      // Check if user exists with same email (CUSTOM provider)
      const existingCustomIdentity =
        await this.authIdentityRepository.findByUsername(userInfo.email);

      if (existingCustomIdentity) {
        // User exists with CUSTOM provider - link accounts
        if (existingCustomIdentity.provider !== AuthIdentityName.CUSTOM) {
          throw new DomainError(
            ErrorCode.EMAIL_ALREADY_EXISTS,
            "An account with this email already exists with a different provider"
          );
        }

        // Verify email matches exactly
        if (
          existingCustomIdentity.username?.toLowerCase().trim() !==
          userInfo.email.toLowerCase().trim()
        ) {
          throw new DomainError(
            ErrorCode.EMAIL_ALREADY_EXISTS,
            "Email mismatch during account linking"
          );
        }

        // Create Google identity and link to existing user
        const googleIdentity = AuthIdentityEntity.create({
          provider: AuthIdentityName.GOOGLE,
          providerUserId: userInfo.id,
          username: userInfo.email,
          password: undefined,
        });

        // Mark email as verified for Google accounts
        const googleIdentityWithVerified = AuthIdentityEntity.reconstitute({
          ...googleIdentity.toPersistence(),
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        });

        const savedGoogleIdentity = await this.authIdentityRepository.create(
          googleIdentityWithVerified
        );

        if (existingCustomIdentity.userId) {
          savedGoogleIdentity.setUser(existingCustomIdentity.userId);
          await this.authIdentityRepository.save(savedGoogleIdentity);

          // Return tokens for existing user
          return await this.generateTokensForUser(
            existingCustomIdentity.userId,
            deviceInfo,
            ipAddress
          );
        } else {
          throw new DomainError(
            ErrorCode.UNEXPECTED_ERROR,
            "Custom identity exists but is not linked to a user"
          );
        }
      }

      // New user - create pending token
      const pendingToken = await this.createPendingToken(userInfo);

      return {
        type: "pending_registration",
        pendingToken,
        userInfo: {
          email: userInfo.email,
          firstName: userInfo.given_name,
          lastName: userInfo.family_name,
          picture: userInfo.picture,
        },
      };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new DomainError(
        ErrorCode.GOOGLE_AUTH_FAILED,
        `Google authentication failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async completeRegistration(
    pendingToken: string,
    companyName: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<SignInResponse> {
    // Verify pending token
    const payload = await this.verifyPendingToken(pendingToken);

    // Check if identity already exists
    const existingIdentity =
      await this.authIdentityRepository.findByProviderAndProviderUserId(
        AuthIdentityName.GOOGLE,
        payload.googleId
      );

    if (existingIdentity) {
      throw new DomainError(
        ErrorCode.EMAIL_ALREADY_EXISTS,
        "An account with this Google ID already exists"
      );
    }

    // Create Google identity
    const emailVO = Email.create(payload.email);
    const googleIdentity = AuthIdentityEntity.create({
      provider: AuthIdentityName.GOOGLE,
      providerUserId: payload.googleId,
      username: emailVO.value,
      password: undefined,
    });

    // Mark email as verified for Google accounts
    const googleIdentityWithVerified = AuthIdentityEntity.reconstitute({
      ...googleIdentity.toPersistence(),
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });

    const savedGoogleIdentity = await this.authIdentityRepository.create(
      googleIdentityWithVerified
    );

    // Create user and organization
    const user = await this.organizationFacade.createUserAndOrganization({
      firstName: payload.firstName || "",
      lastName: payload.lastName || "",
      email: payload.email,
      organization: companyName,
      authIdentityId: savedGoogleIdentity.id,
    });

    // Link identity to user
    savedGoogleIdentity.setUser(user.id);
    await this.authIdentityRepository.save(savedGoogleIdentity);

    // Send welcome email
    await this.sendWelcomeEmail(payload.email, payload.firstName);

    // Generate tokens
    return await this.generateSignInResponse(user.id, deviceInfo, ipAddress);
  }

  // Private methods
  private async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        given_name: data.given_name,
        family_name: data.family_name,
        picture: data.picture,
        verified_email: data.verified_email,
      };
    } catch (error) {
      throw new DomainError(
        ErrorCode.GOOGLE_AUTH_FAILED,
        `Failed to get user info from Google: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async createPendingToken(userInfo: GoogleUserInfo): Promise<string> {
    const payload: PendingTokenPayload = {
      type: "google_pending_registration",
      googleId: userInfo.id,
      email: userInfo.email,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      picture: userInfo.picture,
    };

    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("auth.jwt.secret"),
      expiresIn: "15m",
    });
  }

  private async verifyPendingToken(
    token: string
  ): Promise<PendingTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<PendingTokenPayload>(
        token,
        {
          secret: this.configService.get<string>("auth.jwt.secret"),
        }
      );

      if (payload.type !== "google_pending_registration") {
        throw new DomainError(
          ErrorCode.INVALID_PENDING_TOKEN,
          "Invalid token type"
        );
      }

      return payload;
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new DomainError(
        ErrorCode.INVALID_PENDING_TOKEN,
        "Invalid or expired pending token"
      );
    }
  }

  private async generateSignInResponse(
    userId: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<SignInResponse> {
    const userDetails = await this.organizationFacade.getUserProfile(userId);

    if (userDetails.status === UserStatus.DELETED) {
      throw new DomainError(
        ErrorCode.USER_ACCOUNT_DELETED,
        "This account has been deleted. Please contact support if you believe this is an error."
      );
    }

    if (userDetails.status === UserStatus.SUSPENDED) {
      throw new DomainError(
        ErrorCode.USER_ACCOUNT_DISABLED,
        "This account has been suspended. Please contact support for more information."
      );
    }

    if (!userDetails.memberships || userDetails.memberships.length === 0) {
      throw new DomainError(
        ErrorCode.NO_MEMBERSHIPS_FOUND,
        "This account has no active organization memberships. Please contact support."
      );
    }

    const payload: JWTPayload = {
      sub: userDetails.id,
      userId: userDetails.id,
      username: userDetails.email,
      roles: userDetails.memberships,
    };

    const accessToken = await this.jwtService.signAsync<JWTPayload>(payload, {
      secret: this.configService.get<string>("auth.jwt.secret"),
      expiresIn: (this.configService.get<string>("auth.jwt.expiresIn") ??
        "15m") as jwt.SignOptions["expiresIn"],
    });

    await this.cleanupOldTokensIfNeeded(userId);

    const refreshToken = GeneralUtils.generateToken(48);
    const refreshTokenHash = GeneralUtils.hashToken(refreshToken);
    const refreshTokenExpiresIn =
      this.configService.get<string>("auth.jwt.refreshExpiresIn") ?? "7d";

    const daysMatch = refreshTokenExpiresIn.match(/(\d+)d/);
    const days = daysMatch ? parseInt(daysMatch[1], 10) : 7;
    const expiresAt = DateUtils.addHours(new Date(), days * 24);

    const refreshTokenEntity = RefreshToken.create(
      refreshTokenHash,
      userId,
      expiresAt,
      deviceInfo,
      ipAddress
    );

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async generateTokensForUser(
    userId: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<GoogleAuthResult> {
    const userDetails = await this.organizationFacade.getUserProfile(userId);

    if (userDetails.status === UserStatus.DELETED) {
      throw new DomainError(
        ErrorCode.USER_ACCOUNT_DELETED,
        "This account has been deleted. Please contact support if you believe this is an error."
      );
    }

    if (userDetails.status === UserStatus.SUSPENDED) {
      throw new DomainError(
        ErrorCode.USER_ACCOUNT_DISABLED,
        "This account has been suspended. Please contact support for more information."
      );
    }

    if (!userDetails.memberships || userDetails.memberships.length === 0) {
      throw new DomainError(
        ErrorCode.NO_MEMBERSHIPS_FOUND,
        "This account has no active organization memberships. Please contact support."
      );
    }

    const signInResponse = await this.generateSignInResponse(
      userId,
      deviceInfo,
      ipAddress
    );

    return {
      type: "login",
      accessToken: signInResponse.accessToken,
      refreshToken: signInResponse.refreshToken,
    };
  }

  private async sendWelcomeEmail(
    email: string,
    firstName?: string
  ): Promise<void> {
    try {
      const frontendUrl =
        this.configService.get<string>("frontend.url") ||
        "http://localhost:3001";
      const signInUrl = `${frontendUrl}/auth/authenticate`;

      const template = GeneralUtils.htmlTemplateReader("welcome.html", {
        signInUrl,
        firstName: firstName || "",
      });

      await this.createEmailNotificationUseCase.execute({
        subject: "Bienvenue sur IZZZI",
        template,
        target: email,
      });
    } catch (error) {
      // Log error but don't fail registration
      console.error("Failed to send welcome email:", error);
    }
  }

  private async cleanupOldTokensIfNeeded(userId: string): Promise<void> {
    const count = await this.refreshTokenRepository.countActiveByUserId(userId);
    const maxTokens = 5; // TODO: get from config

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
