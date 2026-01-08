import * as crypto from "crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ILoggerService } from "src/core";

import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminDeleteUserCommand,
  UsernameExistsException,
  InitiateAuthCommand,
  AuthFlowType,
  NotAuthorizedException,
  UserNotConfirmedException,
  UserNotFoundException,
  ForgotPasswordCommand,
  ResendConfirmationCodeCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import {
  ConfirmSignUpData,
  IAuthStrategy,
  SignInResponse,
  SignUpData,
  SignUpResponse,
  RefreshTokenData,
} from "../../domain/types";

import { AuthIdentityName } from "../../domain/types";
import { DomainError, ApplicationError, ErrorCode } from "src/core";
import type { IAuthIdentityRepository } from "../../domain/repositories/authIdentity.repository";
import type { IVerificationTokenRepository } from "../../domain/repositories/verificationToken.repository";
import { AuthIdentityEntity } from "../../domain/entities/authIdentity.entity";

@Injectable()
export class CognitoAdapter implements IAuthStrategy {
  readonly name: AuthIdentityName = AuthIdentityName.AWS_COGNITO;
  private readonly cognito: CognitoIdentityProviderClient;
  private readonly clientId: string;
  private readonly userPoolId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly logger: ILoggerService,
    private readonly verificationTokenRepository: IVerificationTokenRepository,
  ) {
    const aws = this.configService.get<{
      cognito: {
        clientId: string;
        userPoolId: string;
        clientSecret: string;
      };
      region: string;
      credentials: {
        accessKeyId: string;
        secretAccessKey: string;
      };
    }>("aws");
    if (!aws)
      throw new ApplicationError(
        ErrorCode.AWS_CONFIGURATIONS_ARE_MISSING,
        "AWS configuration missing",
      );

    this.clientId = aws.cognito.clientId;
    this.userPoolId = aws.cognito.userPoolId;
    this.clientSecret = aws.cognito.clientSecret;
    this.cognito = new CognitoIdentityProviderClient({
      region: aws.region,
      credentials: aws.credentials,
    });
  }

  async signUp(data: SignUpData): Promise<SignUpResponse> {
    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: data.email,
      Password: data.password,
      SecretHash: this.getSecretHash(data.email),
      UserAttributes: [
        { Name: "given_name", Value: data.firstName },
        { Name: "family_name", Value: data.lastName },
        { Name: "email", Value: data.email },
        { Name: "custom:organization", Value: data.organization },
      ],
    });

    try {
      const response = await this.cognito.send(command);
      if (!response.UserSub) {
        throw new ApplicationError(
          ErrorCode.AWS_COGNITO_SIGNUP_FAILED,
          "AWS Cognito failed to create user.",
        );
      }

      const authIdentity = AuthIdentityEntity.create({
        provider: this.name,
        providerUserId: response.UserSub,
        username: data.email,
      });

      const ormAuthIdentity =
        await this.authIdentityRepository.create(authIdentity);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userData } = data;

      return {
        ...userData,
        authIdentityId: ormAuthIdentity.id,
        verificationToken: "##########",
        sendVerificationToken: false,
      };
    } catch (error) {
      if (error instanceof UsernameExistsException) {
        throw new DomainError(
          ErrorCode.USER_ALREADY_EXISTS,
          "User already exists",
        );
      }
      throw error;
    }
  }

  async signIn(data: {
    email: string;
    password: string;
  }): Promise<SignInResponse> {
    const command = new InitiateAuthCommand({
      ClientId: this.clientId,
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: data.email,
        PASSWORD: data.password,
        SECRET_HASH: this.getSecretHash(data.email),
      },
    });

    try {
      const response = await this.cognito.send(command);

      if (!response.AuthenticationResult) {
        throw new ApplicationError(
          ErrorCode.AWS_COGNITO_ERROR,
          "AWS Cognito authentication failed",
        );
      }

      const { AccessToken, RefreshToken } = response.AuthenticationResult;

      if (!AccessToken || !RefreshToken) {
        throw new ApplicationError(
          ErrorCode.AWS_COGNITO_ERROR,
          "Missing tokens in Cognito response",
        );
      }

      return {
        accessToken: AccessToken,
        refreshToken: RefreshToken,
      };
    } catch (error) {
      if (error instanceof NotAuthorizedException) {
        throw new DomainError(
          ErrorCode.INVALID_CREDENTIALS,
          "Invalid email or password",
        );
      }

      if (error instanceof UserNotConfirmedException) {
        throw new DomainError(
          ErrorCode.USER_ACCOUNT_PENDING,
          "User account is not confirmed. Please verify your email",
        );
      }

      if (error instanceof UserNotFoundException) {
        throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async confirmSignUp(_data: ConfirmSignUpData): Promise<boolean> {
    // const command = new ConfirmSignUpCommand({
    //   ClientId: this.clientId,
    //   Username: data.email,
    //   ConfirmationCode: data.token,
    //   SecretHash: this.getSecretHash(data.email),
    // });

    // try {
    //   await this.cognito.send(command);
    //   const authIdentity = await this.authIdentityRepository.findByUsername(
    //     data.email
    //   );

    //   if (authIdentity) {
    //     authIdentity.verifyEmail(this.name as AuthIdentityName);
    //     await this.authIdentityRepository.save(authIdentity);
    //   }

    //   return true;
    // } catch (error) {
    //   if (error instanceof CodeMismatchException) {
    //     throw new DomainError(
    //       ErrorCode.INVALID_AUTH_DATA,
    //       "Invalid verification code"
    //     );
    //   }

    //   if (error instanceof ExpiredCodeException) {
    //     throw new DomainError(
    //       ErrorCode.INVALID_AUTH_DATA,
    //       "Verification code has expired"
    //     );
    //   }

    //   throw error;
    // }
    return true;
  }

  async resendConfirmationCode(data: { email: string }): Promise<void> {
    const command = new ResendConfirmationCodeCommand({
      ClientId: this.clientId,
      Username: data.email,
      SecretHash: this.getSecretHash(data.email),
    });

    try {
      await this.cognito.send(command);
    } catch (error) {
      this.logger.error(
        `Failed to resend confirmation code for ${data.email}`,
        error instanceof Error ? (error.stack ?? "") : String(error),
      );
      throw error;
    }
  }

  async forgotPassword(data: { email: string }): Promise<void> {
    const command = new ForgotPasswordCommand({
      ClientId: this.clientId,
      Username: data.email,
      SecretHash: this.getSecretHash(data.email),
    });

    try {
      await this.cognito.send(command);
    } catch (error) {
      this.logger.error(
        `Failed to initiate password reset for ${data.email}`,
        error instanceof Error ? (error.stack ?? "") : String(error),
      );
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async confirmForgotPassword(_data: {
    token: string;
    newPassword: string;
  }): Promise<void> {
    // TODO: Implement Cognito password reset with token
    // For now, this is a placeholder that matches the interface
    throw new Error("Cognito password reset not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async changePassword(_data: {
    userId: string;
    username: string;
    oldPassword: string;
    newPassword: string;
  }): Promise<void> {
    // For Cognito, we still need the access token
    // This is a limitation - we might need to pass it separately
    // For now, this will need to be handled differently
    throw new Error(
      "Cognito password change requires access token - not yet implemented with new signature",
    );
    // const command = new ChangePasswordCommand({
    //   AccessToken: data.accessToken,
    //   PreviousPassword: data.oldPassword,
    //   ProposedPassword: data.newPassword,
    // });

    // try {
    //   await this.cognito.send(command);
    // } catch (error) {
    //   if (error instanceof NotAuthorizedException) {
    //     throw new DomainError(
    //       ErrorCode.INVALID_CREDENTIALS,
    //       "Current password is incorrect"
    //     );
    //   }

    //   throw error;
    // }
  }

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async refreshToken(_data: RefreshTokenData): Promise<SignInResponse> {
    return { accessToken: "", refreshToken: "" };
  }

  async deleteIdentity(username: string): Promise<void> {
    const command = new AdminDeleteUserCommand({
      UserPoolId: this.userPoolId,
      Username: username,
    });

    try {
      await this.cognito.send(command);
    } catch (error) {
      this.logger.error(
        `Failed to delete Cognito user: ${username}`,
        error instanceof Error ? (error.stack ?? "") : String(error),
      );
    }
  }

  private getSecretHash(username: string): string {
    return crypto
      .createHmac("SHA256", this.clientSecret)
      .update(username + this.clientId)
      .digest("base64");
  }
}
