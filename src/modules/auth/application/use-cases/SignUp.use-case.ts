import { IUseCase, ILoggerService, BaseUseCase } from "src/core";

import {
  SignUpData,
  IAuthStrategy,
  SignUpResponse,
  AuthIdentityFailedPayload,
} from "../../domain/types";
import { AuthDomainService } from "../../domain/services/auth.domain.service";

export class SignUpUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly authDomainService: AuthDomainService,
    private readonly authProvider: IAuthStrategy
  ) {
    super(logger);
  }

  async execute(data: SignUpData): Promise<SignUpResponse> {
    try {
      this.authDomainService.validateSignUpData(data);
      const response = await this.authProvider.signUp(data);
      this.authDomainService.validateSignUpResponse(response);

      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompenstation(input: AuthIdentityFailedPayload): Promise<void> {
    await this.authProvider.deleteIdentity(input.username);
  }
}
