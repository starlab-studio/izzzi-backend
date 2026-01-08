import { IUseCase, ILoggerService, BaseUseCase } from "src/core";

import { ConfirmSignUpData } from "../../domain/types";
import { IAuthStrategy } from "../../domain/types";

export class ConfirmSignUpUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly authProvider: IAuthStrategy,
  ) {
    super(logger);
  }

  async execute(data: ConfirmSignUpData): Promise<{ success: boolean }> {
    try {
      const success = await this.authProvider.confirmSignUp(data);
      return { success };
    } catch (error) {
      this.handleError(error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async withCompensation(_input: ConfirmSignUpData): Promise<void> {
    // TODO : implement compensation logic
  }
}
