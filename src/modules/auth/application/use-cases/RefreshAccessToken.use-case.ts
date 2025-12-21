import { IUseCase, ILoggerService, BaseUseCase } from "src/core";
import {
  IAuthStrategy,
  RefreshTokenData,
  SignInResponse,
} from "../../domain/types";

export class RefreshAccessTokenUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly authProvider: IAuthStrategy
  ) {
    super(logger);
  }

  async execute(data: RefreshTokenData): Promise<SignInResponse> {
    try {
      return await this.authProvider.refreshToken(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: any): Promise<void> {}
}
