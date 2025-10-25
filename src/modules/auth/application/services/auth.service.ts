import { SignUpData, SignUpResponse } from "../../domain/types";

import { ILoggerService } from "src/core";
import { SignUpUseCase } from "../use-cases/SignUp.use-case";
import { CreateAuthIdentityUseCase } from "../use-cases/CreateAuthIdentity.use-case";

export class AuthService {
  constructor(
    readonly logger: ILoggerService,
    private readonly signUpUseCase: SignUpUseCase,
    private readonly createAuthIdentityUseCase: CreateAuthIdentityUseCase
  ) {}

  async signUp(
    data: SignUpData
  ): Promise<SignUpResponse & { authIdentityId: string }> {
    const signUpResponse = await this.signUpUseCase.execute(data);
    const authIdentityResponse =
      await this.createAuthIdentityUseCase.execute(signUpResponse);

    return {
      ...signUpResponse,
      authIdentityId: authIdentityResponse.id,
      ...authIdentityResponse,
    };
  }
}
