import {
  SignInData,
  SignUpData,
  RefreshTokenData,
  ConfirmSignUpData,
} from "../../domain/types";
import { AuthService } from "../services/auth.service";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { SignInUseCase } from "../use-cases/SignIn.use-case";
import { ConfirmSignUpUseCase } from "../use-cases/ConfirmSignUp.use-case";
import { RefreshAccessTokenUseCase } from "../use-cases/RefreshAccessToken.use-case";

export class AuthFacade {
  constructor(
    private readonly authService: AuthService,
    private readonly signInUseCase: SignInUseCase,
    private readonly organizationFacade: OrganizationFacade,
    private readonly confirmSignUpUseCase: ConfirmSignUpUseCase,
    private readonly refreshAccessTokenUseCase: RefreshAccessTokenUseCase
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
}
