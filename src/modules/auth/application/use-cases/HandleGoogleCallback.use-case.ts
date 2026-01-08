import { IUseCase, ILoggerService, BaseUseCase } from "src/core";
import { GoogleAuthResult } from "../../domain/types";
import { GoogleAuthAdapter } from "../../infrastructure/adapters/google-auth.adapter";

export class HandleGoogleCallbackUseCase
  extends BaseUseCase
  implements IUseCase
{
  constructor(
    readonly logger: ILoggerService,
    private readonly googleAuthAdapter: GoogleAuthAdapter,
  ) {
    super(logger);
  }

  async execute(data: {
    code: string;
    deviceInfo?: string;
    ipAddress?: string;
  }): Promise<GoogleAuthResult> {
    try {
      return await this.googleAuthAdapter.handleCallback(
        data.code,
        data.deviceInfo,
        data.ipAddress,
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(_input: unknown): Promise<void> {}
}
