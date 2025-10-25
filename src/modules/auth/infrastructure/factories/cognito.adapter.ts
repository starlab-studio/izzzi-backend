import * as crypto from "crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminDeleteUserCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider";

import {
  IAuthStrategy,
  SignInResponse,
  SignUpData,
  SignUpResponse,
} from "../../domain/types";

import { AuthIdentityName } from "../../domain/types";
import { DomainError, ApplicationError, ErrorCode } from "src/core";

@Injectable()
export class CognitoAdapter implements IAuthStrategy {
  readonly name: AuthIdentityName = "AWS_COGNITO";
  private readonly cognito: CognitoIdentityProviderClient;
  private readonly clientId: string;
  private readonly userPoolId: string;
  private readonly clientSecret: string;

  constructor(private readonly configService: ConfigService) {
    const aws = this.configService.get("aws");
    if (!aws)
      throw new ApplicationError(
        ErrorCode.AWS_CONFIGURATIONS_ARE_MISSING,
        "AWS configuration missing"
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
          "AWS Cognito failed to create user."
        );
      }

      const { password, ...userData } = data;

      return {
        ...userData,
        provider: this.name,
        providerUserId: response.UserSub,
      };
    } catch (error) {
      if (error instanceof UsernameExistsException) {
        throw new DomainError(
          ErrorCode.USER_ALREADY_EXISTS,
          "User already exists"
        );
      }
      throw error;
    }
  }

  async signIn(data: {
    email: string;
    password: string;
  }): Promise<SignInResponse> {
    return {
      accessToken: "string",
      refreshToken: "string",
    };
  }

  async confirmSignUp(data: { email: string; code: string }): Promise<Boolean> {
    return true;
  }

  async resendConfirmationCode(data: { email: string }): Promise<void> {}

  async forgotPassword(data: { email: string }): Promise<void> {}

  async confirmForgotPassword(data: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<void> {}

  async changePassword(data: {
    accessToken: string;
    oldPassword: string;
    newPassword: string;
  }): Promise<void> {}

  async deleteIdentity(username: string): Promise<void> {
    const command = new AdminDeleteUserCommand({
      UserPoolId: this.userPoolId,
      Username: username,
    });

    try {
      await this.cognito.send(command);
    } catch (error) {
      console.error(`Something went wrong during cognito delete : ${error}`);
    }
  }

  private getSecretHash(username: string): string {
    return crypto
      .createHmac("SHA256", this.clientSecret)
      .update(username + this.clientId)
      .digest("base64");
  }
}
