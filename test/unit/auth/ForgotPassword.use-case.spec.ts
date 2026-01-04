import { Test, TestingModule } from "@nestjs/testing";
import { ForgotPasswordUseCase } from "src/modules/auth/application/use-cases/ForgotPassword.use-case";
import { IAuthStrategy, ForgotPasswordData } from "src/modules/auth/domain/types";
import { ILoggerService, DomainError, ErrorCode } from "src/core";

describe("ForgotPasswordUseCase", () => {
  let useCase: ForgotPasswordUseCase;
  let authProvider: jest.Mocked<IAuthStrategy>;
  let logger: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    const mockAuthProvider = {
      name: "CUSTOM" as any,
      signIn: jest.fn(),
      signUp: jest.fn(),
      confirmSignUp: jest.fn(),
      resendConfirmationCode: jest.fn(),
      forgotPassword: jest.fn().mockResolvedValue(undefined),
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
    useCase = new ForgotPasswordUseCase(logger, authProvider);
  });

  it("should send password reset email successfully", async () => {
    const data: ForgotPasswordData = {
      email: "test@example.com",
    };

    await useCase.execute(data);

    expect(authProvider.forgotPassword).toHaveBeenCalledWith(data);
  });

  it("should include ipAddress and userAgent when provided", async () => {
    const data: ForgotPasswordData & { ipAddress?: string; userAgent?: string } = {
      email: "test@example.com",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0",
    };

    await useCase.execute(data);

    expect(authProvider.forgotPassword).toHaveBeenCalledWith(data);
  });

  it("should throw error for non-existent email", async () => {
    const data: ForgotPasswordData = {
      email: "nonexistent@example.com",
    };

    authProvider.forgotPassword.mockRejectedValue(
      new DomainError(ErrorCode.USER_NOT_FOUND, "User not found")
    );

    await expect(useCase.execute(data)).rejects.toThrow(DomainError);
  });

  it("should handle errors gracefully", async () => {
    const data: ForgotPasswordData = {
      email: "test@example.com",
    };

    authProvider.forgotPassword.mockRejectedValue(new Error("Unexpected error"));

    await expect(useCase.execute(data)).rejects.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });
});

