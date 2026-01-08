import {
  IUseCase,
  ILoggerService,
  BaseUseCase,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  IAuthStrategy,
  RefreshTokenData,
  SignInResponse,
} from "../../domain/types";
import { GeneralUtils } from "src/utils/general.utils";
import { IRefreshTokenRepository } from "../../domain/repositories/refreshToken.repository";

export class RefreshAccessTokenUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly authStrategies: IAuthStrategy[],
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {
    super(logger);
  }

  async execute(data: RefreshTokenData): Promise<SignInResponse> {
    try {
      const refreshTokenHash = GeneralUtils.hashToken(data.refreshToken);
      const refreshTokenEntity =
        await this.refreshTokenRepository.findByTokenHash(refreshTokenHash);

      if (!refreshTokenEntity) {
        throw new DomainError(
          ErrorCode.INVALID_REFRESH_TOKEN,
          "Invalid refresh token",
        );
      }

      if (refreshTokenEntity.isExpired()) {
        await this.refreshTokenRepository.delete(refreshTokenEntity.id);
        throw new DomainError(
          ErrorCode.REFRESH_TOKEN_EXPIRED_OR_REVOKED,
          "Refresh token expired",
        );
      }

      if (refreshTokenEntity.provider) {
        const adapter = this.authStrategies.find(
          (s) => s.name === refreshTokenEntity.provider,
        );
        if (!adapter) {
          throw new DomainError(
            ErrorCode.INVALID_REFRESH_TOKEN,
            "Auth provider not available",
          );
        }
        return await adapter.refreshToken(data);
      }

      throw new DomainError(
        ErrorCode.INVALID_REFRESH_TOKEN,
        "Refresh token is invalid. Please sign in again.",
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(_input: unknown): Promise<void> {}
}
