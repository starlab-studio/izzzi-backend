import {
  SignInData,
  SignUpData,
  RefreshTokenData,
  ConfirmSignUpData,
  ForgotPasswordData,
  ResetPasswordData,
  IAuthStrategy,
  GoogleAuthResult,
} from "../../domain/types";
import { AuthService } from "../services/auth.service";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { SignInUseCase } from "../use-cases/SignIn.use-case";
import { ConfirmSignUpUseCase } from "../use-cases/ConfirmSignUp.use-case";
import { RefreshAccessTokenUseCase } from "../use-cases/RefreshAccessToken.use-case";
import { ForgotPasswordUseCase } from "../use-cases/ForgotPassword.use-case";
import { ResetPasswordUseCase } from "../use-cases/ResetPassword.use-case";
import {
  ChangePasswordUseCase,
  ChangePasswordData,
} from "../use-cases/ChangePassword.use-case";
import {
  SignUpFromInvitationUseCase,
  SignUpFromInvitationData,
} from "../use-cases/SignUpFromInvitation.use-case";
import { HandleGoogleCallbackUseCase } from "../use-cases/HandleGoogleCallback.use-case";
import { CompleteGoogleSignUpUseCase } from "../use-cases/CompleteGoogleSignUp.use-case";
import { IRefreshTokenRepository } from "../../domain/repositories/refreshToken.repository";
import { IAuthIdentityRepository } from "../../domain/repositories/authIdentity.repository";
import { AuthIdentityName } from "../../domain/types";
import { GoogleAuthAdapter } from "../../infrastructure/adapters/google-auth.adapter";

export class AuthFacade {
  constructor(
    private readonly authService: AuthService,
    private readonly signInUseCase: SignInUseCase,
    private readonly organizationFacade: OrganizationFacade,
    private readonly confirmSignUpUseCase: ConfirmSignUpUseCase,
    private readonly refreshAccessTokenUseCase: RefreshAccessTokenUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly signUpFromInvitationUseCase: SignUpFromInvitationUseCase,
    private readonly handleGoogleCallbackUseCase: HandleGoogleCallbackUseCase,
    private readonly completeGoogleSignUpUseCase: CompleteGoogleSignUpUseCase,
    private readonly authStrategy: IAuthStrategy,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly googleAuthAdapter: GoogleAuthAdapter
  ) {}

  async signUp(data: SignUpData) {
    try {
      return await this.authService.signUp(this.organizationFacade, data);
    } catch (error) {
      throw error;
    }
  }

  async signIn(data: SignInData & { deviceInfo?: string; ipAddress?: string }) {
    try {
      return await this.signInUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }

  async refreshAccessToken(data: RefreshTokenData) {
    try {
      return await this.refreshAccessTokenUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }

  async confirmEmail(input: ConfirmSignUpData) {
    try {
      return await this.confirmSignUpUseCase.execute(input);
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(
    data: ForgotPasswordData & { ipAddress?: string; userAgent?: string }
  ) {
    try {
      return await this.forgotPasswordUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(data: ResetPasswordData) {
    try {
      return await this.resetPasswordUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }

  async changePassword(data: ChangePasswordData) {
    try {
      return await this.changePasswordUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }

  async signUpFromInvitation(data: SignUpFromInvitationData) {
    try {
      return await this.signUpFromInvitationUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }

  async generateAccessTokenForUser(userId: string): Promise<string> {
    try {
      return await (this.authStrategy as any).generateAccessTokenForUser(
        userId
      );
    } catch (error) {
      throw error;
    }
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    try {
      await this.refreshTokenRepository.revokeAllByUserId(userId);
    } catch (error) {
      throw error;
    }
  }

  async handleGoogleCallback(data: {
    code: string;
    deviceInfo?: string;
    ipAddress?: string;
  }): Promise<GoogleAuthResult> {
    try {
      return await this.handleGoogleCallbackUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }

  async completeGoogleSignUp(data: {
    pendingToken: string;
    companyName: string;
    deviceInfo?: string;
    ipAddress?: string;
  }) {
    try {
      return await this.completeGoogleSignUpUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }

  getGoogleAuthorizationUrl(state?: string): string {
    return this.googleAuthAdapter.getAuthorizationUrl(state);
  }

  async getUserProviders(userId: string): Promise<{
    providers: string[];
    canChangePassword: boolean;
    canLinkGoogle: boolean;
  }> {
    try {
      const identities =
        await this.authIdentityRepository.findAllByUserId(userId);

      const providers = identities.map((i) => i.provider);
      const hasCustom = providers.includes(AuthIdentityName.CUSTOM);
      const hasGoogle = providers.includes(AuthIdentityName.GOOGLE);

      return {
        providers,
        canChangePassword: hasCustom,
        canLinkGoogle: !hasGoogle,
      };
    } catch (error) {
      throw error;
    }
  }
}
