import { Inject, Injectable } from "@nestjs/common";
import { ApplicationError, ErrorCode } from "src/core";
import {
  IAuthStrategy,
  AuthIdentityName,
  AUTH_STRATEGY_TOKEN,
} from "../../domain/types";

@Injectable()
export class AuthIdentityFactory {
  private readonly strategies: Map<AuthIdentityName, IAuthStrategy>;
  constructor(@Inject(AUTH_STRATEGY_TOKEN) strategies: IAuthStrategy[]) {
    this.strategies = new Map(
      strategies.map((strategy) => [strategy.name, strategy]),
    );
  }

  create(identity: AuthIdentityName): IAuthStrategy {
    const strategy = this.strategies.get(identity);

    if (!strategy) {
      throw new ApplicationError(
        ErrorCode.INVALID_AUTH_POVIDER,
        `Invalid authentication provider: ${identity}`,
      );
    }

    return strategy;
  }
}
