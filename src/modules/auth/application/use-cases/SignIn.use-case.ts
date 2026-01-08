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
    private readonly authProvider: IAuthStrategy,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async withCompensation(_input: AuthIdentityFailedPayload): Promise<void> {}
}
