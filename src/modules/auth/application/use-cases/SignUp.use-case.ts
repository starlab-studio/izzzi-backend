import { IUseCase, ILoggerService, BaseUseCase } from "src/core";

import {
  SignUpData,
  IAuthStrategy,
  SignUpResponse,
  AuthIdentityFailedPayload,
} from "../../domain/types";

export class SignUpUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly authProvider: IAuthStrategy,
  ) {
    super(logger);
  }

  async execute(data: SignUpData): Promise<SignUpResponse> {
    try {
      return await this.authProvider.signUp(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: AuthIdentityFailedPayload): Promise<void> {
    await this.authProvider.deleteIdentity(input.username);
  }
}
