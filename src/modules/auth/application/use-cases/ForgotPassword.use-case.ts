import { IUseCase, ILoggerService, BaseUseCase } from "src/core";
import { IAuthStrategy, ForgotPasswordData } from "../../domain/types";

export class ForgotPasswordUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly authProvider: IAuthStrategy
  ) {
    super(logger);
  }

  async execute(
    data: ForgotPasswordData & { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    try {
      return await this.authProvider.forgotPassword(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: any): Promise<void> {}
}
