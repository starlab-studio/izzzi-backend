import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";

import {
  LoggerService,
  EventStore,
  EventHandlerRegistry,
  ILoggerService,
  IEventStore,
} from "src/core";

import { CoreModule } from "src/core/core.module";
import { OrganizationModule } from "../organization";
import { OrganizationFacade } from "../organization/application/facades/organization.facade";
import { AUTH_STRATEGY_TOKEN, IAuthStrategy } from "./domain/types";
import { AuthDomainService } from "./domain/services/auth.domain.service";
import { SignUpUseCase } from "./application/use-cases/SignUp.use-case";
import { AuthService } from "./application/services/auth.service";
import { AuthController } from "./interface/controllers/auth.controller";
import { AuthIdentity } from "./infrastructure/models/authIdentity.model";
import { IAuthIdentityRepository } from "./domain/repositories/authIdentity.repository";
import { AuthIdentityRepository } from "./infrastructure/repositories/authIdentity.repository";
import { AuthIdentityFactory } from "./infrastructure/factories/auth.factory";
import { AuthFacade } from "./application/facades/auth.facade";
import { AuthIdentityFailedHandler } from "./application/handlers/AuthIdentityFailed.handler";
import { UserFailedHandler } from "./application/handlers/UserFailed.handler";
import { CognitoAdapter } from "./infrastructure/factories/cognito.adapter";
import { CustomAuthAdapter } from "./infrastructure/factories/custom.adapter";
import { SignInUseCase } from "./application/use-cases/SignIn.use-case";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AuthIdentity]),
    CoreModule,
    OrganizationModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("auth.jwt.secret"),
        signOptions: {
          expiresIn: configService.get("auth.jwt.expiresIn") || "24h",
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoggerService,
    AuthIdentityRepository,
    AuthIdentityFactory,
    AuthDomainService,
    {
      provide: CognitoAdapter,
      useFactory: (
        configService: ConfigService,
        authIdentityRepository: IAuthIdentityRepository
      ) => new CognitoAdapter(configService, authIdentityRepository),
      inject: [ConfigService, AuthIdentityRepository],
    },
    {
      provide: CustomAuthAdapter,
      useFactory: (
        configService: ConfigService,
        jwtService: JwtService,
        authIdentityRepository: IAuthIdentityRepository,
        organizationFacade: OrganizationFacade
      ) =>
        new CustomAuthAdapter(
          configService,
          jwtService,
          authIdentityRepository,
          organizationFacade
        ),
      inject: [
        ConfigService,
        JwtService,
        AuthIdentityRepository,
        OrganizationFacade,
      ],
    },
    {
      provide: AUTH_STRATEGY_TOKEN,
      useFactory: (
        cognitoAdapter: CognitoAdapter,
        customAuthAdapter: CustomAuthAdapter
      ): IAuthStrategy[] => {
        return [cognitoAdapter, customAuthAdapter];
      },
      inject: [CognitoAdapter, CustomAuthAdapter],
    },
    {
      provide: "AUTH_IDENTITY_PROVIDER",
      useFactory: (factory: AuthIdentityFactory): IAuthStrategy => {
        const provider = "CUSTOM";
        return factory.create(provider);
      },
      inject: [AuthIdentityFactory],
    },
    {
      provide: SignUpUseCase,
      useFactory: (
        logger: ILoggerService,
        authDomainService: AuthDomainService,
        authProvider: IAuthStrategy
      ) => new SignUpUseCase(logger, authDomainService, authProvider),
      inject: [LoggerService, AuthDomainService, "AUTH_IDENTITY_PROVIDER"],
    },
    {
      provide: AuthService,
      useFactory: (logger: LoggerService, signUpUseCase: SignUpUseCase) =>
        new AuthService(logger, signUpUseCase),
      inject: [LoggerService, SignUpUseCase],
    },
    {
      provide: SignInUseCase,
      useFactory: (logger: ILoggerService, authProvider: IAuthStrategy) =>
        new SignInUseCase(logger, authProvider),
      inject: [LoggerService, "AUTH_IDENTITY_PROVIDER"],
    },
    {
      provide: AuthFacade,
      useFactory: (
        authService: AuthService,
        signInUseCase: SignInUseCase,
        organizationFacade: OrganizationFacade
      ) => new AuthFacade(authService, signInUseCase, organizationFacade),
      inject: [AuthService, SignInUseCase, OrganizationFacade],
    },
    {
      provide: AuthIdentityFailedHandler,
      useFactory: (
        logger: ILoggerService,
        eventStore: IEventStore,
        signUpUseCase: SignUpUseCase
      ) => new AuthIdentityFailedHandler(logger, eventStore, signUpUseCase),
      inject: [LoggerService, EventStore, SignUpUseCase],
    },
    {
      provide: UserFailedHandler,
      useFactory: (
        logger: ILoggerService,
        eventStore: IEventStore,
        signUpUseCase: SignUpUseCase
      ) => new UserFailedHandler(logger, eventStore, signUpUseCase),
      inject: [LoggerService, EventStore, SignUpUseCase],
    },
  ],
})
export class AuthModule {
  constructor(
    private readonly eventHandlerRegistry: EventHandlerRegistry,
    private readonly authIdentityFailedHandler: AuthIdentityFailedHandler,
    private readonly userFailedHandler: UserFailedHandler
  ) {}

  async onModuleInit() {
    this.eventHandlerRegistry.registerHandler(
      "auth_identity.failed",
      this.authIdentityFailedHandler
    );
    this.eventHandlerRegistry.registerHandler(
      "user.failed",
      this.userFailedHandler
    );
  }
}
