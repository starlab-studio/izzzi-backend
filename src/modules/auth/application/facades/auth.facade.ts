import { SignInData, SignUpData } from "../../domain/types";
import { AuthService } from "../services/auth.service";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { SignInUseCase } from "../use-cases/SignIn.use-case";

export class AuthFacade {
  constructor(
    private readonly authService: AuthService,
    private readonly signInUseCase: SignInUseCase,
    private readonly organizationFacade: OrganizationFacade
  ) {}

  async signUp(data: SignUpData) {
    try {
      return await this.authService.signUp(this.organizationFacade, data);
    } catch (error) {
      throw error;
    }
  }

  async signIn(data: SignInData) {
    try {
      return await this.signInUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }
}
