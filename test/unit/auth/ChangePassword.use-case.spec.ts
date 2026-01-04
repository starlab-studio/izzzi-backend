import { Test, TestingModule } from "@nestjs/testing";
import { ChangePasswordUseCase, ChangePasswordData } from "src/modules/auth/application/use-cases/ChangePassword.use-case";
import { IAuthStrategy } from "src/modules/auth/domain/types";
import { ILoggerService, DomainError, ErrorCode } from "src/core";

describe("ChangePasswordUseCase", () => {
  let useCase: ChangePasswordUseCase;
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
      changePassword: jest.fn().mockResolvedValue(undefined),
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
    useCase = new ChangePasswordUseCase(logger, authProvider);
  });

  it("should change password successfully", async () => {
    const data: ChangePasswordData = {
      userId: "user-123",
      username: "test@example.com",
      oldPassword: "OldPass123!",
      newPassword: "NewPass123!",
    };

    await useCase.execute(data);

    expect(authProvider.changePassword).toHaveBeenCalledWith(data);
  });

  it("should throw error for incorrect old password", async () => {
    const data: ChangePasswordData = {
      userId: "user-123",
      username: "test@example.com",
      oldPassword: "WrongPass123!",
      newPassword: "NewPass123!",
    };

    authProvider.changePassword.mockRejectedValue(
      new DomainError(ErrorCode.INCORRECT_PASSWORD, "Incorrect old password")
    );

    await expect(useCase.execute(data)).rejects.toThrow(DomainError);
  });

  it("should throw error for weak new password", async () => {
    const data: ChangePasswordData = {
      userId: "user-123",
      username: "test@example.com",
      oldPassword: "OldPass123!",
      newPassword: "weak",
    };

    authProvider.changePassword.mockRejectedValue(
      new DomainError(ErrorCode.INVALID_PASSWORD, "Password does not meet requirements")
    );

    await expect(useCase.execute(data)).rejects.toThrow(DomainError);
  });

  it("should handle errors gracefully", async () => {
    const data: ChangePasswordData = {
      userId: "user-123",
      username: "test@example.com",
      oldPassword: "OldPass123!",
      newPassword: "NewPass123!",
    };

    authProvider.changePassword.mockRejectedValue(new Error("Unexpected error"));

    await expect(useCase.execute(data)).rejects.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });
});

