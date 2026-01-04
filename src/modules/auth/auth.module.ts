import { Module, forwardRef } from "@nestjs/common";
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
import { NotificationModule } from "../notification";
import { CreateEmailNotificationUseCase } from "../notification/application/use-cases/create-email-notification.use-case";
import {
  AUTH_STRATEGY_TOKEN,
  AuthIdentityName,
  IAuthStrategy,
} from "./domain/types";
import { SignUpUseCase } from "./application/use-cases/SignUp.use-case";
import { AuthService } from "./application/services/auth.service";
import { AuthController } from "./interface/controllers/auth.controller";
import { GoogleAuthController } from "./interface/controllers/google-auth.controller";
import { AuthIdentityModel } from "./infrastructure/models/authIdentity.model";
import { AuthIdentityUniquenessService } from "./domain/services/authIdentity-uniqueness.service";
import { VerificationTokenModel } from "./infrastructure/models/verificationToken.model";
import { IAuthIdentityRepository } from "./domain/repositories/authIdentity.repository";
import { IRefreshTokenRepository } from "./domain/repositories/refreshToken.repository";
import { AuthIdentityRepository } from "./infrastructure/repositories/authIdentity.repository";
import { VerificationTokenRepository } from "./infrastructure/repositories/verificationToken.repository";
import { AuthIdentityFactory } from "./infrastructure/factories/auth.factory";
import { AuthFacade } from "./application/facades/auth.facade";
import { AuthIdentityFailedHandler } from "./application/handlers/AuthIdentityFailed.handler";
import { UserFailedHandler } from "./application/handlers/UserFailed.handler";
import { CognitoAdapter } from "./infrastructure/factories/cognito.adapter";
import { CustomAuthAdapter } from "./infrastructure/factories/custom.adapter";
import { GoogleAuthAdapter } from "./infrastructure/adapters/google-auth.adapter";
import { SignInUseCase } from "./application/use-cases/SignIn.use-case";
import { HandleGoogleCallbackUseCase } from "./application/use-cases/HandleGoogleCallback.use-case";
import { CompleteGoogleSignUpUseCase } from "./application/use-cases/CompleteGoogleSignUp.use-case";
import { ConfirmSignUpUseCase } from "./application/use-cases/ConfirmSignUp.use-case";
import { RefreshTokenModel } from "./infrastructure/models/refreshToken.model";
import { RefreshTokenRepository } from "./infrastructure/repositories/refreshToken.repository";
import { RefreshAccessTokenUseCase } from "./application/use-cases/RefreshAccessToken.use-case";
import { PasswordResetTokenModel } from "./infrastructure/models/passwordResetToken.model";
import { PasswordResetTokenRepository } from "./infrastructure/repositories/passwordResetToken.repository";
import { ForgotPasswordUseCase } from "./application/use-cases/ForgotPassword.use-case";
import { ResetPasswordUseCase } from "./application/use-cases/ResetPassword.use-case";
import { ChangePasswordUseCase } from "./application/use-cases/ChangePassword.use-case";
import { SignUpFromInvitationUseCase } from "./application/use-cases/SignUpFromInvitation.use-case";
import { IPasswordResetTokenRepository } from "./domain/repositories/passwordResetToken.repository";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      AuthIdentityModel,
      VerificationTokenModel,
      RefreshTokenModel,
      PasswordResetTokenModel,
    ]),
    forwardRef(() => CoreModule),
    forwardRef(() => OrganizationModule),
    NotificationModule,
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
  controllers: [AuthController, GoogleAuthController],
  providers: [
    LoggerService,
    AuthIdentityRepository,
    VerificationTokenRepository,
    RefreshTokenRepository,
    PasswordResetTokenRepository,
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
        refreshTokenRepository: RefreshTokenRepository,
        passwordResetTokenRepository: IPasswordResetTokenRepository,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase
      ) =>
        new CustomAuthAdapter(
          configService,
          jwtService,
          authIdentityUniquenessService,
          authIdentityRepository,
          organizationFacade,
          verificationTokenRepository,
          refreshTokenRepository,
          passwordResetTokenRepository,
          createEmailNotificationUseCase
        ),
      inject: [
        ConfigService,
        JwtService,
        AuthIdentityUniquenessService,
        AuthIdentityRepository,
        OrganizationFacade,
        VerificationTokenRepository,
        RefreshTokenRepository,
        PasswordResetTokenRepository,
        CreateEmailNotificationUseCase,
      ],
    },
    {
      provide: GoogleAuthAdapter,
      useFactory: (
        configService: ConfigService,
        jwtService: JwtService,
        authIdentityRepository: IAuthIdentityRepository,
        refreshTokenRepository: RefreshTokenRepository,
        organizationFacade: OrganizationFacade,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase
      ) =>
        new GoogleAuthAdapter(
          configService,
          jwtService,
          authIdentityRepository,
          refreshTokenRepository,
          organizationFacade,
          createEmailNotificationUseCase
        ),
      inject: [
        ConfigService,
        JwtService,
        AuthIdentityRepository,
        RefreshTokenRepository,
        OrganizationFacade,
        CreateEmailNotificationUseCase,
      ],
    },
    {
      provide: AUTH_STRATEGY_TOKEN,
      useFactory: (
        cognitoAdapter: CognitoAdapter,
        customAuthAdapter: CustomAuthAdapter,
        googleAuthAdapter: GoogleAuthAdapter
      ): IAuthStrategy[] => {
        return [cognitoAdapter, customAuthAdapter, googleAuthAdapter];
      },
      inject: [CognitoAdapter, CustomAuthAdapter, GoogleAuthAdapter],
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
        signUpUseCase: SignUpUseCase,
        authIdentityRepository: IAuthIdentityRepository
      ) =>
        new AuthService(
          logger,
          eventStore,
          signUpUseCase,
          authIdentityRepository
        ),
      inject: [
        LoggerService,
        EventStore,
        SignUpUseCase,
        AuthIdentityRepository,
      ],
    },
    {
      provide: SignInUseCase,
      useFactory: (logger: ILoggerService, authProvider: IAuthStrategy) =>
        new SignInUseCase(logger, authProvider),
      inject: [LoggerService, "AUTH_IDENTITY_PROVIDER"],
    },
    {
      provide: RefreshAccessTokenUseCase,
      useFactory: (logger: ILoggerService, authProvider: IAuthStrategy) =>
        new RefreshAccessTokenUseCase(logger, authProvider),
      inject: [LoggerService, "AUTH_IDENTITY_PROVIDER"],
    },
    {
      provide: ForgotPasswordUseCase,
      useFactory: (logger: ILoggerService, authProvider: IAuthStrategy) =>
        new ForgotPasswordUseCase(logger, authProvider),
      inject: [LoggerService, "AUTH_IDENTITY_PROVIDER"],
    },
    {
      provide: ResetPasswordUseCase,
      useFactory: (logger: ILoggerService, authProvider: IAuthStrategy) =>
        new ResetPasswordUseCase(logger, authProvider),
      inject: [LoggerService, "AUTH_IDENTITY_PROVIDER"],
    },
    {
      provide: ChangePasswordUseCase,
      useFactory: (logger: ILoggerService, authProvider: IAuthStrategy) =>
        new ChangePasswordUseCase(logger, authProvider),
      inject: [LoggerService, "AUTH_IDENTITY_PROVIDER"],
    },
    {
      provide: AuthFacade,
      useFactory: (
        authService: AuthService,
        signInUseCase: SignInUseCase,
        organizationFacade: OrganizationFacade,
        confirmSignUpUseCase: ConfirmSignUpUseCase,
        refreshAccessTokenUseCase: RefreshAccessTokenUseCase,
        forgotPasswordUseCase: ForgotPasswordUseCase,
        resetPasswordUseCase: ResetPasswordUseCase,
        changePasswordUseCase: ChangePasswordUseCase,
        signUpFromInvitationUseCase: SignUpFromInvitationUseCase,
        handleGoogleCallbackUseCase: HandleGoogleCallbackUseCase,
        completeGoogleSignUpUseCase: CompleteGoogleSignUpUseCase,
        authStrategy: IAuthStrategy,
        refreshTokenRepository: IRefreshTokenRepository,
        authIdentityRepository: IAuthIdentityRepository,
        googleAuthAdapter: GoogleAuthAdapter
      ) =>
        new AuthFacade(
          authService,
          signInUseCase,
          organizationFacade,
          confirmSignUpUseCase,
          refreshAccessTokenUseCase,
          forgotPasswordUseCase,
          resetPasswordUseCase,
          changePasswordUseCase,
          signUpFromInvitationUseCase,
          handleGoogleCallbackUseCase,
          completeGoogleSignUpUseCase,
          authStrategy,
          refreshTokenRepository,
          authIdentityRepository,
          googleAuthAdapter
        ),
      inject: [
        AuthService,
        SignInUseCase,
        OrganizationFacade,
        ConfirmSignUpUseCase,
        RefreshAccessTokenUseCase,
        ForgotPasswordUseCase,
        ResetPasswordUseCase,
        ChangePasswordUseCase,
        SignUpFromInvitationUseCase,
        HandleGoogleCallbackUseCase,
        CompleteGoogleSignUpUseCase,
        "AUTH_IDENTITY_PROVIDER",
        RefreshTokenRepository,
        AuthIdentityRepository,
        GoogleAuthAdapter,
      ],
    },
    {
      provide: SignUpFromInvitationUseCase,
      useFactory: (
        logger: ILoggerService,
        eventStore: IEventStore,
        authProvider: IAuthStrategy,
        authIdentityRepository: IAuthIdentityRepository,
        organizationFacade: OrganizationFacade
      ) =>
        new SignUpFromInvitationUseCase(
          logger,
          eventStore,
          authProvider,
          authIdentityRepository,
          organizationFacade
        ),
      inject: [
        LoggerService,
        EventStore,
        "AUTH_IDENTITY_PROVIDER",
        AuthIdentityRepository,
        OrganizationFacade,
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
      provide: ConfirmSignUpUseCase,
      useFactory: (logger: ILoggerService, authProvider: IAuthStrategy) =>
        new ConfirmSignUpUseCase(logger, authProvider),
      inject: [LoggerService, "AUTH_IDENTITY_PROVIDER"],
    },
    {
      provide: HandleGoogleCallbackUseCase,
      useFactory: (
        logger: ILoggerService,
        googleAuthAdapter: GoogleAuthAdapter
      ) => new HandleGoogleCallbackUseCase(logger, googleAuthAdapter),
      inject: [LoggerService, GoogleAuthAdapter],
    },
    {
      provide: CompleteGoogleSignUpUseCase,
      useFactory: (
        logger: ILoggerService,
        googleAuthAdapter: GoogleAuthAdapter
      ) => new CompleteGoogleSignUpUseCase(logger, googleAuthAdapter),
      inject: [LoggerService, GoogleAuthAdapter],
    },
  ],
  exports: [AuthFacade, "AUTH_IDENTITY_PROVIDER", RefreshTokenRepository],
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
