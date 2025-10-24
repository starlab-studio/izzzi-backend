import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import {
  IEventStore,
  ILoggerService,
  LoggerService,
  EventStore,
  EventHandlerRegistry,
} from "src/core";
import { CoreModule } from "src/core/core.module";
import { User } from "./infrastructure/models/user.model";
import { UserDomainService } from "./domain/services/user.domain.service";
import { CreateUserUseCase } from "./application/use-cases/CreateUser.use-case";
import { UserController } from "./interface/controllers/user.controller";
import { AuthIdentityCreatedHandler } from "./application/handlers/AuthIdentityCreated.handler";
import { IUserRepository } from "./domain/repositories/user.repository";
import { UserRepository } from "./infrastructure/repositories/user.repository";
import { OrganizationService } from "./application/services/organization.service";
import { OrganizationFacade } from "./application/facades/organization.facade";
import { CreateOrganizationUseCase } from "./application/use-cases/CreateOrganization.use-case";
import { OrganizationDomainService } from "./domain/services/organization.domain.service";
import { IOrganizationRepository } from "./domain/repositories/organization.repository";
import { OrganizationRepository } from "./infrastructure/repositories/organization.repository";
import { Organization } from "./infrastructure/models/organization.model";

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization]), CoreModule],
  controllers: [UserController],
  providers: [
    { provide: "LOGGER_SERVICE", useClass: LoggerService },
    { provide: "USER_DOMAIN_SERVICE", useClass: UserDomainService },
    { provide: "USER_REPOSITORY", useClass: UserRepository },
    {
      provide: "ORGANIZATION_DOMAIN_SERVICE",
      useClass: OrganizationDomainService,
    },
    { provide: "ORGANIZATION_REPOSITORY", useClass: OrganizationRepository },
    {
      provide: "CREATE_USER_USE_CASE",
      useFactory: (
        logger: LoggerService,
        eventStore: EventStore,
        userDomainService: UserDomainService,
        userRepository: IUserRepository
      ) =>
        new CreateUserUseCase(
          logger,
          eventStore,
          userDomainService,
          userRepository
        ),
      inject: [
        "LOGGER_SERVICE",
        EventStore,
        "USER_DOMAIN_SERVICE",
        "USER_REPOSITORY",
      ],
    },
    {
      provide: "CREATE_ORGANIZATION_USE_CASE",
      useFactory: (
        logger: LoggerService,
        eventStore: EventStore,
        organizationDomainService: OrganizationDomainService,
        organizationRepository: IOrganizationRepository
      ) =>
        new CreateOrganizationUseCase(
          logger,
          eventStore,
          organizationDomainService,
          organizationRepository
        ),
      inject: [
        "LOGGER_SERVICE",
        EventStore,
        "ORGANIZATION_DOMAIN_SERVICE",
        "ORGANIZATION_REPOSITORY",
      ],
    },
    {
      provide: "ORGANIZATION_SERVICE",
      useFactory: (
        logger: ILoggerService,
        createUserUseCase: CreateUserUseCase,
        createOrganizationUseCase: CreateOrganizationUseCase
      ) =>
        new OrganizationService(
          logger,
          createUserUseCase,
          createOrganizationUseCase
        ),
      inject: [
        "LOGGER_SERVICE",
        "CREATE_USER_USE_CASE",
        "CREATE_ORGANIZATION_USE_CASE",
      ],
    },
    {
      provide: EventHandlerRegistry,
      useFactory: (logger: ILoggerService, eventStore: IEventStore) =>
        new EventHandlerRegistry(eventStore, logger),
      inject: ["LOGGER_SERVICE", EventStore],
    },
    {
      provide: AuthIdentityCreatedHandler,
      useFactory: (
        logger: ILoggerService,
        eventStore: EventStore,
        createUserUseCase: CreateUserUseCase
      ) =>
        new AuthIdentityCreatedHandler(logger, eventStore, createUserUseCase),
      inject: ["LOGGER_SERVICE", EventStore, "CREATE_USER_USE_CASE"],
    },
    {
      provide: OrganizationFacade,
      useFactory: (organizationService: OrganizationService) =>
        new OrganizationFacade(organizationService),
      inject: ["ORGANIZATION_SERVICE"],
    },
  ],
  exports: [OrganizationFacade],
})
export class OrganizationModule {
  constructor() {}
}
