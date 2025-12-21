import {
  SignInData,
  SignUpData,
  RefreshTokenData,
  ConfirmSignUpData,
  ForgotPasswordData,
  ResetPasswordData,
} from "../../domain/types";
import { AuthService } from "../services/auth.service";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { SignInUseCase } from "../use-cases/SignIn.use-case";
import { ConfirmSignUpUseCase } from "../use-cases/ConfirmSignUp.use-case";
import { RefreshAccessTokenUseCase } from "../use-cases/RefreshAccessToken.use-case";
import { ForgotPasswordUseCase } from "../use-cases/ForgotPassword.use-case";
import { ResetPasswordUseCase } from "../use-cases/ResetPassword.use-case";

export class AuthFacade {
  constructor(
    private readonly authService: AuthService,
    private readonly signInUseCase: SignInUseCase,
    private readonly organizationFacade: OrganizationFacade,
    private readonly confirmSignUpUseCase: ConfirmSignUpUseCase,
    private readonly refreshAccessTokenUseCase: RefreshAccessTokenUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase
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
}
