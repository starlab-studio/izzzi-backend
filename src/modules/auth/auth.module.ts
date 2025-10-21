import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { LoggerService, EventStore } from "src/core";
import { CoreModule } from "src/core/core.module";
import { OrganizationModule } from "../organization";
import { OrganizationFacade } from "../organization/application/facades/organization.facade";
import { IAuthStrategy } from "./domain/types";
import { AuthDomainService } from "./domain/services/auth.domain.service";
import { SignUpUseCase } from "./application/use-cases/SignUp.use-case";
import { AuthService } from "./application/services/auth.service";
import { CreateAuthIdentityUseCase } from "./application/use-cases/CreateAuthIdentity.use-case";
import { AuthController } from "./interface/controllers/auth.controller";
import { AuthIdentity } from "./infrastructure/models/authIdentity.model";
import { AuthIdentityRepository } from "./infrastructure/repositories/authIdentity.repository";
import { AuthIdentityFactory } from "./infrastructure/factories/auth.factory";
import { IAuthIdentityRepository } from "./domain/repositories/authIdentity.repository";
import { AuthFacade } from "./application/facades/auth.facade";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AuthIdentity]),
    CoreModule,
    OrganizationModule,
  ],
  controllers: [AuthController],
  providers: [
    LoggerService,
    AuthIdentityRepository,
    AuthIdentityFactory,
    AuthDomainService,
    {
      provide: "AUTH_IDENTITY_PROVIDER",
      useFactory: (
        factory: AuthIdentityFactory,
        configService: ConfigService
      ): IAuthStrategy => {
        const provider = configService.get("auth.provider");
        return factory.create(provider);
      },
      inject: [AuthIdentityFactory, ConfigService],
    },
    {
      provide: SignUpUseCase,
      useFactory: (
        logger: LoggerService,
        authDomainService: AuthDomainService,
        authProvider: IAuthStrategy
      ) => new SignUpUseCase(logger, authDomainService, authProvider),
      inject: [LoggerService, AuthDomainService, "AUTH_IDENTITY_PROVIDER"],
    },
    {
      provide: CreateAuthIdentityUseCase,
      useFactory: (
        logger: LoggerService,
        authDomainService: AuthDomainService,
        authIdentityRepository: IAuthIdentityRepository,
        eventStore: EventStore
      ) =>
        new CreateAuthIdentityUseCase(
          logger,
          authDomainService,
          authIdentityRepository,
          eventStore
        ),
      inject: [
        LoggerService,
        AuthDomainService,
        AuthIdentityRepository,
        EventStore,
      ],
    },
    {
      provide: AuthService,
      useFactory: (
        logger: LoggerService,
        signUpUseCase: SignUpUseCase,
        createAuthIdentityUseCase: CreateAuthIdentityUseCase
      ) => new AuthService(logger, signUpUseCase, createAuthIdentityUseCase),
      inject: [LoggerService, SignUpUseCase, CreateAuthIdentityUseCase],
    },
    {
      provide: AuthFacade,
      useFactory: (
        authService: AuthService,
        organizationFacade: OrganizationFacade
      ) => new AuthFacade(authService, organizationFacade),
      inject: [AuthService, OrganizationFacade],
    },
  ],
})
export class AuthModule {}
