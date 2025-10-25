import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import {
  IEventStore,
  ILoggerService,
  LoggerService,
  EventStore,
  TypeOrmUnitOfWork,
  EventHandlerRegistry,
  IUnitOfWork,
} from "src/core";
import { CoreModule } from "src/core/core.module";
import { UserModel } from "./infrastructure/models/user.model";
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
import { OrganizationModel } from "./infrastructure/models/organization.model";
import { AddUserToOrganizationUseCase } from "./application/use-cases/AddUserToOrganization.use-case";
import { MembershipDomainService } from "./domain/services/membership.domain.service";
import { MembershipModel } from "./infrastructure/models/membership.model";
import { MembershipRepository } from "./infrastructure/repositories/membership.repository";
import { IMembershipRepository } from "./domain/repositories/membership.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserModel, OrganizationModel, MembershipModel]),
    CoreModule,
  ],
  controllers: [UserController],
  providers: [
    { provide: "LOGGER_SERVICE", useClass: LoggerService },
    { provide: "USER_DOMAIN_SERVICE", useClass: UserDomainService },
    {
      provide: "USER_REPOSITORY",
      useFactory: (unitOfWork: IUnitOfWork) => new UserRepository(unitOfWork),
      inject: [TypeOrmUnitOfWork],
    },
    {
      provide: "ORGANIZATION_DOMAIN_SERVICE",
      useClass: OrganizationDomainService,
    },
    {
      provide: "ORGANIZATION_REPOSITORY",
      useFactory: (unitOfWork: IUnitOfWork) =>
        new OrganizationRepository(unitOfWork),
      inject: [TypeOrmUnitOfWork],
    },
    { provide: "MEMBERSHIP_DOMAIN_SERVICE", useClass: MembershipDomainService },
    {
      provide: "MEMBERSHIP_REPOSITORY",
      useFactory: (unitOfWork: IUnitOfWork) =>
        new MembershipRepository(unitOfWork),
      inject: [TypeOrmUnitOfWork],
    },
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
        logger: ILoggerService,
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
      provide: "ADD_USER_TO_ORGANIZATION_USE_CASE",
      useFactory: (
        logger: ILoggerService,
        membershipDomainService: MembershipDomainService,
        membershipRepository: IMembershipRepository
      ) =>
        new AddUserToOrganizationUseCase(
          logger,
          membershipDomainService,
          membershipRepository
        ),
      inject: [
        "LOGGER_SERVICE",
        "MEMBERSHIP_DOMAIN_SERVICE",
        "MEMBERSHIP_REPOSITORY",
      ],
    },
    {
      provide: "ORGANIZATION_SERVICE",
      useFactory: (
        logger: ILoggerService,
        unitOfWork: IUnitOfWork,
        createUserUseCase: CreateUserUseCase,
        createOrganizationUseCase: CreateOrganizationUseCase,
        addUserToOrganizationUseCase: AddUserToOrganizationUseCase
      ) =>
        new OrganizationService(
          logger,
          unitOfWork,
          createUserUseCase,
          createOrganizationUseCase,
          addUserToOrganizationUseCase
        ),
      inject: [
        "LOGGER_SERVICE",
        TypeOrmUnitOfWork,
        "CREATE_USER_USE_CASE",
        "CREATE_ORGANIZATION_USE_CASE",
        "ADD_USER_TO_ORGANIZATION_USE_CASE",
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
