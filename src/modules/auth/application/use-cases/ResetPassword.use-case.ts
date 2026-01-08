import { IUseCase, ILoggerService, BaseUseCase } from "src/core";
import { IAuthStrategy, ResetPasswordData } from "../../domain/types";

export class ResetPasswordUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly authProvider: IAuthStrategy,
  ) {
    super(logger);
  }

  async execute(data: ResetPasswordData): Promise<void> {
    try {
      return await this.authProvider.confirmForgotPassword(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(_input: unknown): Promise<void> {}
}
