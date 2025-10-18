import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CognitoAdapter } from "./cognito.adapter";
import { DomainError, ErrorCode } from "src/core";
import { IAuthStrategy, AuthIdentityName } from "../../domain/types";

@Injectable()
export class AuthIdentityFactory {
  constructor(private readonly configService: ConfigService) {}

  create(identity: AuthIdentityName): IAuthStrategy {
    switch (identity) {
      case "AWS_COGNITO":
        return new CognitoAdapter(this.configService);
      default:
        throw new DomainError(
          ErrorCode.INVALID_AUTH_POVIDER_DATA,
          "Invalid authentication provider"
        );
    }
  }
}
