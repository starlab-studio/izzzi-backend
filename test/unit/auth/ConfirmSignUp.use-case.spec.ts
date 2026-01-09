import { Test, TestingModule } from "@nestjs/testing";
import { ConfirmSignUpUseCase } from "src/modules/auth/application/use-cases/ConfirmSignUp.use-case";
import { IAuthStrategy, ConfirmSignUpData } from "src/modules/auth/domain/types";
import { ILoggerService, DomainError, ErrorCode } from "src/core";

describe("ConfirmSignUpUseCase", () => {
  let useCase: ConfirmSignUpUseCase;
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
    useCase = new ConfirmSignUpUseCase(logger, authProvider);
  });

  it("should confirm sign up successfully", async () => {
    const data: ConfirmSignUpData = {
      token: "verification-token-123",
    };

    authProvider.confirmSignUp.mockResolvedValue(true);

    const result = await useCase.execute(data);

    expect(authProvider.confirmSignUp).toHaveBeenCalledWith(data);
    expect(result).toEqual({ success: true });
  });

  it("should return false when confirmation fails", async () => {
    const data: ConfirmSignUpData = {
      token: "invalid-token",
    };

    authProvider.confirmSignUp.mockResolvedValue(false);

    const result = await useCase.execute(data);

    expect(result).toEqual({ success: false });
  });

  it("should throw error for invalid token", async () => {
    const data: ConfirmSignUpData = {
      token: "invalid-token",
    };

    authProvider.confirmSignUp.mockRejectedValue(
      new DomainError(ErrorCode.INVALID_AUTH_DATA, "Invalid verification token")
    );

    await expect(useCase.execute(data)).rejects.toThrow(DomainError);
  });

  it("should throw error when token is expired", async () => {
    const data: ConfirmSignUpData = {
      token: "expired-token",
    };

    authProvider.confirmSignUp.mockRejectedValue(
      new DomainError(ErrorCode.INVALID_AUTH_DATA, "Verification token expired")
    );

    await expect(useCase.execute(data)).rejects.toThrow(DomainError);
  });
});

