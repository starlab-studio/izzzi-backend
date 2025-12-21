import { IUseCase, ILoggerService, BaseUseCase } from "src/core";
import { IAuthStrategy } from "../../domain/types";

export type ChangePasswordData = {
  userId: string;
  username: string;
  oldPassword: string;
  newPassword: string;
};

export class ChangePasswordUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly authProvider: IAuthStrategy
  ) {
    super(logger);
  }

  async execute(data: ChangePasswordData): Promise<void> {
    try {
      return await this.authProvider.changePassword(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: any): Promise<void> {}
}
