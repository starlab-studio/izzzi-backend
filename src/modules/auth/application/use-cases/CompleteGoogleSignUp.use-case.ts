import { IUseCase, ILoggerService, BaseUseCase } from "src/core";
import { SignInResponse } from "../../domain/types";
import { GoogleAuthAdapter } from "../../infrastructure/adapters/google-auth.adapter";

export class CompleteGoogleSignUpUseCase
  extends BaseUseCase
  implements IUseCase
{
  constructor(
    readonly logger: ILoggerService,
    private readonly googleAuthAdapter: GoogleAuthAdapter
  ) {
    super(logger);
  }

  async execute(data: {
    pendingToken: string;
    companyName: string;
    deviceInfo?: string;
    ipAddress?: string;
  }): Promise<SignInResponse> {
    try {
      return await this.googleAuthAdapter.completeRegistration(
        data.pendingToken,
        data.companyName,
        data.deviceInfo,
        data.ipAddress
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: any): Promise<void> {}
}
