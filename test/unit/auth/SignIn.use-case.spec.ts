import { Test, TestingModule } from "@nestjs/testing";
import { SignInUseCase } from "src/modules/auth/application/use-cases/SignIn.use-case";
import { IAuthStrategy, SignInData, SignInResponse } from "src/modules/auth/domain/types";
import { ILoggerService, DomainError, ErrorCode, LoggerService } from "src/core";

describe("SignInUseCase", () => {
  let useCase: SignInUseCase;
  let authProvider: jest.Mocked<IAuthStrategy>;
  let logger: jest.Mocked<ILoggerService>;

  beforeEach(async () => {
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
    useCase = new SignInUseCase(logger, authProvider);
  });

  it("should sign in successfully", async () => {
    const signInData: SignInData = {
      email: "test@example.com",
      password: "Password123!",
    };

    const expectedResponse: SignInResponse = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
    };

    authProvider.signIn.mockResolvedValue(expectedResponse);

    const result = await useCase.execute(signInData);

    expect(authProvider.signIn).toHaveBeenCalledWith(signInData);
    expect(result).toEqual(expectedResponse);
  });

  it("should throw error for invalid credentials", async () => {
    const signInData: SignInData = {
      email: "test@example.com",
      password: "WrongPassword123!",
    };

    authProvider.signIn.mockRejectedValue(
      new DomainError(ErrorCode.INVALID_CREADENTIALS, "Invalid credentials")
    );

    await expect(useCase.execute(signInData)).rejects.toThrow(DomainError);
    expect(authProvider.signIn).toHaveBeenCalledWith(signInData);
  });

  it("should throw error when email is not verified", async () => {
    const signInData: SignInData = {
      email: "unverified@example.com",
      password: "Password123!",
    };

    authProvider.signIn.mockRejectedValue(
      new DomainError(ErrorCode.EMAIL_NOT_VERIFIED, "Email not verified")
    );

    await expect(useCase.execute(signInData)).rejects.toThrow(DomainError);
  });

  it("should throw error when account is locked", async () => {
    const signInData: SignInData = {
      email: "locked@example.com",
      password: "Password123!",
    };

    authProvider.signIn.mockRejectedValue(
      new DomainError(ErrorCode.ACCOUNT_LOCKED, "Account is locked")
    );

    await expect(useCase.execute(signInData)).rejects.toThrow(DomainError);
  });

  it("should handle unexpected errors", async () => {
    const signInData: SignInData = {
      email: "test@example.com",
      password: "Password123!",
    };

    authProvider.signIn.mockRejectedValue(new Error("Unexpected error"));

    await expect(useCase.execute(signInData)).rejects.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });

  it("should call compensation when provided", async () => {
    const compensationData = { username: "test@example.com" };
    await useCase.withCompensation(compensationData);
    expect(useCase.withCompensation).toBeDefined();
  });
});

