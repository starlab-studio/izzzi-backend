import { SignUpData } from "../../domain/types";
import { AuthService } from "../services/auth.service";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export class AuthFacade {
  constructor(
    private readonly authService: AuthService,
    private readonly organizationFacade: OrganizationFacade
  ) {}

  async signUp(data: SignUpData) {
    try {
      return await this.authService.signUp(this.organizationFacade, data);
    } catch (error) {
      throw error;
    }
  }
}
