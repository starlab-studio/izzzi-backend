import { Test, TestingModule } from "@nestjs/testing";
import { RefreshAccessTokenUseCase } from "src/modules/auth/application/use-cases/RefreshAccessToken.use-case";
import { IAuthStrategy, RefreshTokenData, SignInResponse } from "src/modules/auth/domain/types";
import { ILoggerService, DomainError, ErrorCode } from "src/core";

describe("RefreshAccessTokenUseCase", () => {
  let useCase: RefreshAccessTokenUseCase;
  let authProvider: jest.Mocked<IAuthStrategy>;
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

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };

    authProvider = mockAuthProvider as any;
    logger = mockLogger as any;
    useCase = new RefreshAccessTokenUseCase(logger, authProvider);
  });

  it("should refresh access token successfully", async () => {
    const data: RefreshTokenData = {
      refreshToken: "refresh-token-123",
    };

    const expectedResponse: SignInResponse = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    };

    authProvider.refreshToken.mockResolvedValue(expectedResponse);

    const result = await useCase.execute(data);

    expect(authProvider.refreshToken).toHaveBeenCalledWith(data);
    expect(result).toEqual(expectedResponse);
  });

  it("should throw error for invalid refresh token", async () => {
    const data: RefreshTokenData = {
      refreshToken: "invalid-token",
    };

    authProvider.refreshToken.mockRejectedValue(
      new DomainError(ErrorCode.INVALID_TOKEN, "Invalid refresh token")
    );

    await expect(useCase.execute(data)).rejects.toThrow(DomainError);
  });

  it("should throw error for expired refresh token", async () => {
    const data: RefreshTokenData = {
      refreshToken: "expired-token",
    };

    authProvider.refreshToken.mockRejectedValue(
      new DomainError(ErrorCode.TOKEN_EXPIRED, "Refresh token expired")
    );

    await expect(useCase.execute(data)).rejects.toThrow(DomainError);
  });

  it("should handle errors gracefully", async () => {
    const data: RefreshTokenData = {
      refreshToken: "refresh-token-123",
    };

    authProvider.refreshToken.mockRejectedValue(new Error("Unexpected error"));

    await expect(useCase.execute(data)).rejects.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });
});

