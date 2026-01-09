import { Test, TestingModule } from "@nestjs/testing";
import { ResetPasswordUseCase } from "src/modules/auth/application/use-cases/ResetPassword.use-case";
import { IAuthStrategy, ResetPasswordData } from "src/modules/auth/domain/types";
import { ILoggerService, DomainError, ErrorCode } from "src/core";

describe("ResetPasswordUseCase", () => {
  let useCase: ResetPasswordUseCase;
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
      confirmForgotPassword: jest.fn().mockResolvedValue(undefined),
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
    useCase = new ResetPasswordUseCase(logger, authProvider);
  });

  it("should reset password successfully", async () => {
    const data: ResetPasswordData = {
      token: "reset-token-123",
      newPassword: "NewPass123!",
    };

    await useCase.execute(data);

    expect(authProvider.confirmForgotPassword).toHaveBeenCalledWith(data);
  });

  it("should throw error for invalid token", async () => {
    const data: ResetPasswordData = {
      token: "invalid-token",
      newPassword: "NewPass123!",
    };

    authProvider.confirmForgotPassword.mockRejectedValue(
      new DomainError(ErrorCode.INVALID_AUTH_DATA, "Invalid reset token")
    );

    await expect(useCase.execute(data)).rejects.toThrow(DomainError);
  });

  it("should throw error for expired token", async () => {
    const data: ResetPasswordData = {
      token: "expired-token",
      newPassword: "NewPass123!",
    };

    authProvider.confirmForgotPassword.mockRejectedValue(
      new DomainError(ErrorCode.INVALID_AUTH_DATA, "Reset token expired")
    );

    await expect(useCase.execute(data)).rejects.toThrow(DomainError);
  });

  it("should throw error for weak password", async () => {
    const data: ResetPasswordData = {
      token: "reset-token-123",
      newPassword: "weak",
    };

    authProvider.confirmForgotPassword.mockRejectedValue(
      new DomainError(ErrorCode.INVALID_PASSWORD, "Password does not meet requirements")
    );

    await expect(useCase.execute(data)).rejects.toThrow(DomainError);
  });
});

