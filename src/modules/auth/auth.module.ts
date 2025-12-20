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
import {
  AUTH_STRATEGY_TOKEN,
  AuthIdentityName,
  IAuthStrategy,
} from "./domain/types";
import { SignUpUseCase } from "./application/use-cases/SignUp.use-case";
import { AuthService } from "./application/services/auth.service";
import { AuthController } from "./interface/controllers/auth.controller";
import { AuthIdentityModel } from "./infrastructure/models/authIdentity.model";
import { AuthIdentityUniquenessService } from "./domain/services/authIdentity-uniqueness.service";
import { VerificationTokenModel } from "./infrastructure/models/verificationToken.model";
import { IAuthIdentityRepository } from "./domain/repositories/authIdentity.repository";
import { AuthIdentityRepository } from "./infrastructure/repositories/authIdentity.repository";
import { VerificationTokenRepository } from "./infrastructure/repositories/verificationToken.repository";
import { AuthIdentityFactory } from "./infrastructure/factories/auth.factory";
import { AuthFacade } from "./application/facades/auth.facade";
import { AuthIdentityFailedHandler } from "./application/handlers/AuthIdentityFailed.handler";
import { UserFailedHandler } from "./application/handlers/UserFailed.handler";
import { CognitoAdapter } from "./infrastructure/factories/cognito.adapter";
import { CustomAuthAdapter } from "./infrastructure/factories/custom.adapter";
import { SignInUseCase } from "./application/use-cases/SignIn.use-case";
import { ConfirmSignUpUseCase } from "./application/use-cases/ConfirmSignUp.use-case";
import { UserCreatedEventHandler } from "./application/handlers/UserCreated.handler";
import { RefreshTokenModel } from "./infrastructure/models/refreshToken.model";
import { RefreshTokenRepository } from "./infrastructure/repositories/refreshToken.repository";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      AuthIdentityModel,
      VerificationTokenModel,
      RefreshTokenModel,
    ]),
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
    VerificationTokenRepository,
    RefreshTokenRepository,
    AuthIdentityFactory,
    AuthIdentityUniquenessService,
    {
      provide: AuthIdentityUniquenessService,
      useFactory: (authIdentityRepository: IAuthIdentityRepository) =>
        new AuthIdentityUniquenessService(authIdentityRepository),
      inject: [AuthIdentityRepository],
    },
    {
      provide: CognitoAdapter,
      useFactory: (
        configService: ConfigService,
        authIdentityRepository: IAuthIdentityRepository,
        logger: ILoggerService,
        verificationTokenRepository: VerificationTokenRepository
      ) =>
        new CognitoAdapter(
          configService,
          authIdentityRepository,
          logger,
          verificationTokenRepository
        ),
      inject: [
        ConfigService,
        AuthIdentityRepository,
        LoggerService,
        VerificationTokenRepository,
      ],
    },
    {
      provide: CustomAuthAdapter,
      useFactory: (
        configService: ConfigService,
        jwtService: JwtService,
        authIdentityUniquenessService: AuthIdentityUniquenessService,
        authIdentityRepository: IAuthIdentityRepository,
        organizationFacade: OrganizationFacade,
        verificationTokenRepository: VerificationTokenRepository,
        refreshTokenRepository: RefreshTokenRepository
      ) =>
        new CustomAuthAdapter(
          configService,
          jwtService,
          authIdentityUniquenessService,
          authIdentityRepository,
          organizationFacade,
          verificationTokenRepository,
          refreshTokenRepository
        ),
      inject: [
        ConfigService,
        JwtService,
        AuthIdentityUniquenessService,
        AuthIdentityRepository,
        OrganizationFacade,
        VerificationTokenRepository,
        RefreshTokenRepository,
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
      useFactory: (
        factory: AuthIdentityFactory,
        configService: ConfigService
      ): IAuthStrategy => {
        const provider =
          configService.get<string>("auth.provider") || AuthIdentityName.CUSTOM;
        return factory.create(provider as AuthIdentityName);
      },
      inject: [AuthIdentityFactory, ConfigService],
    },
    {
      provide: SignUpUseCase,
      useFactory: (logger: ILoggerService, authProvider: IAuthStrategy) =>
        new SignUpUseCase(logger, authProvider),
      inject: [LoggerService, "AUTH_IDENTITY_PROVIDER"],
    },
    {
      provide: AuthService,
      useFactory: (
        logger: LoggerService,
        eventStore: EventStore,
        signUpUseCase: SignUpUseCase
      ) => new AuthService(logger, eventStore, signUpUseCase),
      inject: [LoggerService, EventStore, SignUpUseCase],
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
        organizationFacade: OrganizationFacade,
        confirmSignUpUseCase: ConfirmSignUpUseCase
      ) =>
        new AuthFacade(
          authService,
          signInUseCase,
          organizationFacade,
          confirmSignUpUseCase
        ),
      inject: [
        AuthService,
        SignInUseCase,
        OrganizationFacade,
        ConfirmSignUpUseCase,
      ],
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
    {
      provide: UserCreatedEventHandler,
      useFactory: (
        logger: ILoggerService,
        authIdentityRepository: AuthIdentityRepository
      ) => new UserCreatedEventHandler(logger, authIdentityRepository),
      inject: [LoggerService, AuthIdentityRepository],
    },
    {
      provide: ConfirmSignUpUseCase,
      useFactory: (logger: ILoggerService, authProvider: IAuthStrategy) =>
        new ConfirmSignUpUseCase(logger, authProvider),
      inject: [LoggerService, "AUTH_IDENTITY_PROVIDER"],
    },
  ],
  exports: [AuthFacade],
})
export class AuthModule {
  constructor(
    private readonly eventHandlerRegistry: EventHandlerRegistry,
    private readonly authIdentityFailedHandler: AuthIdentityFailedHandler,
    private readonly userCreatedHandler: UserCreatedEventHandler,
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
    this.eventHandlerRegistry.registerHandler(
      "signup.succeed",
      this.userCreatedHandler
    );
  }
}
