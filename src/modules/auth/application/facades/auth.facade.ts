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
      const authResponse = await this.authService.signUp(data);
      await this.organizationFacade.createUserAndOrganization(authResponse);
      const { authIdentityId, ...response } = authResponse;
      return response;
    } catch (error) {
      throw error;
    }
  }
}
