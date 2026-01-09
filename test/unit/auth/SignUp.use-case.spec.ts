import { Test, TestingModule } from "@nestjs/testing";
import { SignUpUseCase } from "src/modules/auth/application/use-cases/SignUp.use-case";
import { IAuthStrategy, SignUpData, SignUpResponse, AuthIdentityFailedPayload } from "src/modules/auth/domain/types";
import { ILoggerService, DomainError, ErrorCode, LoggerService } from "src/core";

describe("SignUpUseCase", () => {
  let useCase: SignUpUseCase;
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
      deleteIdentity: jest.fn().mockResolvedValue(undefined),
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
    useCase = new SignUpUseCase(logger, authProvider);
  });

  it("should sign up successfully", async () => {
    const signUpData: SignUpData = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "Password123!",
      organization: "Test Org",
    };

    const expectedResponse: SignUpResponse = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      organization: "Test Org",
      authIdentityId: "auth-id",
      verificationToken: "token",
      sendVerificationToken: true,
    };

    authProvider.signUp.mockResolvedValue(expectedResponse);

    const result = await useCase.execute(signUpData);

    expect(authProvider.signUp).toHaveBeenCalledWith(signUpData);
    expect(result).toEqual(expectedResponse);
  });

  it("should throw error when email already exists", async () => {
    const signUpData: SignUpData = {
      firstName: "John",
      lastName: "Doe",
      email: "existing@example.com",
      password: "Password123!",
      organization: "Test Org",
    };

    authProvider.signUp.mockRejectedValue(
      new DomainError(ErrorCode.EMAIL_ALREADY_EXISTS, "Email already exists")
    );

    await expect(useCase.execute(signUpData)).rejects.toThrow(DomainError);
  });

  it("should handle validation errors", async () => {
    const signUpData: SignUpData = {
      firstName: "",
      lastName: "Doe",
      email: "invalid-email",
      password: "weak",
      organization: "",
    };

    authProvider.signUp.mockRejectedValue(
      new DomainError(ErrorCode.INVALID_AUTH_DATA, "Invalid signup data")
    );

    await expect(useCase.execute(signUpData)).rejects.toThrow(DomainError);
  });

  it("should call compensation to delete identity on failure", async () => {
    const compensationData: AuthIdentityFailedPayload = {
      username: "test@example.com",
    };

    await useCase.withCompensation(compensationData);

    expect(authProvider.deleteIdentity).toHaveBeenCalledWith("test@example.com");
  });
});

