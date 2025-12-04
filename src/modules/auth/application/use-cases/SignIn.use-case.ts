import { IUseCase, ILoggerService, BaseUseCase } from "src/core";
import {
  AuthIdentityFailedPayload,
  IAuthStrategy,
  SignInData,
  SignInResponse,
} from "../../domain/types";

export class SignInUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly authProvider: IAuthStrategy
  ) {
    super(logger);
  }

  async execute(data: SignInData): Promise<SignInResponse> {
    try {
      return await this.authProvider.signIn(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: AuthIdentityFailedPayload): Promise<void> {}
}
