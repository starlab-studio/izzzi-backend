import { SignUpData, SignUpResponse } from "../../domain/types";

import { ILoggerService } from "src/core";
import { SignUpUseCase } from "../use-cases/SignUp.use-case";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export class AuthService {
  constructor(
    private readonly logger: ILoggerService,
    private readonly signUpUseCase: SignUpUseCase
  ) {}

  async signUp(
    organizationFacade: OrganizationFacade,
    data: SignUpData
  ): Promise<SignUpResponse | undefined> {
    try {
      const signUpResponse = await this.signUpUseCase.execute(data);
      await organizationFacade.createUserAndOrganization(signUpResponse);
      // TODO: Implement the logic to update Auth_identity to add userId

      return signUpResponse;
    } catch (error) {
      this.logger.error(`Something went wrong : ${error}`, "auth/service");
      throw error;
    }
  }
}
