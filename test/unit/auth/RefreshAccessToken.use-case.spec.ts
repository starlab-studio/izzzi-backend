import { Test, TestingModule } from "@nestjs/testing";
import { RefreshAccessTokenUseCase } from "src/modules/auth/application/use-cases/RefreshAccessToken.use-case";
import { IAuthStrategy, RefreshTokenData, SignInResponse } from "src/modules/auth/domain/types";
import { ILoggerService, DomainError, ErrorCode } from "src/core";
import { RefreshToken } from "src/modules/auth/domain/entities/refreshToken.entity";

describe("RefreshAccessTokenUseCase", () => {
  let useCase: RefreshAccessTokenUseCase;
  let authProvider: jest.Mocked<IAuthStrategy>;
  let refreshTokenRepository: any;
  let logger: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    const mockAuthProvider = {
      name: "CUSTOM" as any,
      signIn: jest.fn(),
      signUp: jest.fn(),
      confirmSignUp: jest.fn(),
      resendConfirmationCode: jest.fn(),
      forgotPassword: jest.fn(),
      confirmForgotPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      deleteIdentity: jest.fn(),
    };

    const mockRefreshTokenRepo = {
      findByTokenHash: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };

    authProvider = mockAuthProvider as any;
    refreshTokenRepository = mockRefreshTokenRepo;
    logger = mockLogger as any;
    useCase = new RefreshAccessTokenUseCase(logger, [authProvider], refreshTokenRepository);
  });

  it("should refresh access token successfully", async () => {
    const data: RefreshTokenData = {
      refreshToken: "refresh-token-123",
    };

    const expectedResponse: SignInResponse = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const mockToken = RefreshToken.create(
      "token-hash",
      "user-123",
      expiresAt,
      "CUSTOM"
    );

    refreshTokenRepository.findByTokenHash.mockResolvedValue(mockToken);
    authProvider.refreshToken.mockResolvedValue(expectedResponse);

    const result = await useCase.execute(data);

    expect(authProvider.refreshToken).toHaveBeenCalledWith(data);
    expect(result).toEqual(expectedResponse);
  });

  it("should throw error for invalid refresh token", async () => {
    const data: RefreshTokenData = {
      refreshToken: "invalid-token",
    };

    refreshTokenRepository.findByTokenHash.mockResolvedValue(null);

    await expect(useCase.execute(data)).rejects.toThrow(DomainError);
  });

  it("should throw error for expired refresh token", async () => {
    const data: RefreshTokenData = {
      refreshToken: "expired-token",
    };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() - 1);

    const mockExpiredToken = RefreshToken.create(
      "token-hash",
      "user-123",
      expiresAt,
      "CUSTOM"
    );

    refreshTokenRepository.findByTokenHash.mockResolvedValue(mockExpiredToken);

    await expect(useCase.execute(data)).rejects.toThrow(DomainError);
  });

  it("should handle errors gracefully", async () => {
    const data: RefreshTokenData = {
      refreshToken: "refresh-token-123",
    };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const mockToken = RefreshToken.create(
      "token-hash",
      "user-123",
      expiresAt,
      "CUSTOM"
    );

    refreshTokenRepository.findByTokenHash.mockResolvedValue(mockToken);
    authProvider.refreshToken.mockRejectedValue(new Error("Unexpected error"));

    await expect(useCase.execute(data)).rejects.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });
});

