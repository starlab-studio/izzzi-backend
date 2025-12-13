import { Module, forwardRef } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";

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
import { CreateUserUseCase } from "./application/use-cases/CreateUser.use-case";
import { UserController } from "./interface/controllers/user.controller";
import { IUserRepository } from "./domain/repositories/user.repository";
import { UserRepository } from "./infrastructure/repositories/user.repository";
import { OrganizationService } from "./application/services/organization.service";
import { OrganizationFacade } from "./application/facades/organization.facade";
import { CreateOrganizationUseCase } from "./application/use-cases/CreateOrganization.use-case";
import { IOrganizationRepository } from "./domain/repositories/organization.repository";
import { OrganizationRepository } from "./infrastructure/repositories/organization.repository";
import { OrganizationModel } from "./infrastructure/models/organization.model";
import { AddUserToOrganizationUseCase } from "./application/use-cases/AddUserToOrganization.use-case";
import { MembershipModel } from "./infrastructure/models/membership.model";
import { MembershipRepository } from "./infrastructure/repositories/membership.repository";
import { IMembershipRepository } from "./domain/repositories/membership.repository";
import { GetUserDetailsUseCase } from "./application/use-cases/GetUserDetails.use-case";
import { InvitationModel } from "./infrastructure/models/invitation.model";
import { InvitationAuthorizationService } from "./domain/services/invitation-authorization.service";
import { IInvitationRepository } from "./domain/repositories/invitation.repository";
import { SendInvitationUseCase } from "./application/use-cases/send-invitation.use-case";
import { InvitationRepository } from "./infrastructure/repositories/invitation.repository";
import { OrganizationController } from "./interface/controllers/organization.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserModel,
      OrganizationModel,
      MembershipModel,
      InvitationModel,
    ]),
    forwardRef(() => CoreModule),
  ],
  controllers: [OrganizationController, UserController],
  providers: [
    { provide: "LOGGER_SERVICE", useClass: LoggerService },
    {
      provide: "USER_REPOSITORY",
      useFactory: (
        ormRepository: Repository<UserModel>,
        unitOfWork: IUnitOfWork
      ) => new UserRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(UserModel), TypeOrmUnitOfWork],
    },
    {
      provide: "ORGANIZATION_REPOSITORY",
      useFactory: (
        ormRepository: Repository<OrganizationModel>,
        unitOfWork: IUnitOfWork
      ) => new OrganizationRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(OrganizationModel), TypeOrmUnitOfWork],
    },
    {
      provide: "MEMBERSHIP_REPOSITORY",
      useFactory: (
        ormRepository: Repository<MembershipModel>,
        unitOfWork: IUnitOfWork
      ) => new MembershipRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(MembershipModel), TypeOrmUnitOfWork],
    },
    {
      provide: "INVITATION_REPOSITORY",
      useFactory: (
        ormRepository: Repository<InvitationModel>,
        unitOfWork: IUnitOfWork
      ) => new InvitationRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(InvitationModel), TypeOrmUnitOfWork],
    },
    {
      provide: "CREATE_USER_USE_CASE",
      useFactory: (
        logger: LoggerService,
        eventStore: EventStore,
        userRepository: IUserRepository
      ) => new CreateUserUseCase(logger, eventStore, userRepository),
      inject: ["LOGGER_SERVICE", EventStore, "USER_REPOSITORY"],
    },
    {
      provide: "CREATE_ORGANIZATION_USE_CASE",
      useFactory: (
        logger: ILoggerService,
        eventStore: EventStore,
        organizationRepository: IOrganizationRepository
      ) =>
        new CreateOrganizationUseCase(
          logger,
          eventStore,
          organizationRepository
        ),
      inject: ["LOGGER_SERVICE", EventStore, "ORGANIZATION_REPOSITORY"],
    },
    {
      provide: "ADD_USER_TO_ORGANIZATION_USE_CASE",
      useFactory: (
        logger: ILoggerService,
        membershipRepository: IMembershipRepository
      ) => new AddUserToOrganizationUseCase(logger, membershipRepository),
      inject: ["LOGGER_SERVICE", "MEMBERSHIP_REPOSITORY"],
    },
    {
      provide: "GET_USER_DETAILS_USE_CASE",
      useFactory: (logger: ILoggerService, userRepository: IUserRepository) =>
        new GetUserDetailsUseCase(logger, userRepository),
      inject: ["LOGGER_SERVICE", "USER_REPOSITORY"],
    },
    InvitationAuthorizationService,
    {
      provide: SendInvitationUseCase,
      useFactory: (
        logger: ILoggerService,
        eventStore: IEventStore,
        authorizationService: InvitationAuthorizationService,
        userRepository: IUserRepository,
        organizationRepository: IOrganizationRepository,
        invitationRepository: IInvitationRepository
      ) =>
        new SendInvitationUseCase(
          logger,
          eventStore,
          authorizationService,
          userRepository,
          organizationRepository,
          invitationRepository
        ),
      inject: [
        "LOGGER_SERVICE",
        EventStore,
        InvitationAuthorizationService,
        "USER_REPOSITORY",
        "ORGANIZATION_REPOSITORY",
        "INVITATION_REPOSITORY",
      ],
    },
    {
      provide: "ORGANIZATION_SERVICE",
      useFactory: (
        logger: ILoggerService,
        eventStore: IEventStore,
        unitOfWork: IUnitOfWork,
        createUserUseCase: CreateUserUseCase,
        createOrganizationUseCase: CreateOrganizationUseCase,
        addUserToOrganizationUseCase: AddUserToOrganizationUseCase
      ) =>
        new OrganizationService(
          logger,
          eventStore,
          unitOfWork,
          createUserUseCase,
          createOrganizationUseCase,
          addUserToOrganizationUseCase
        ),
      inject: [
        "LOGGER_SERVICE",
        EventStore,
        TypeOrmUnitOfWork,
        "CREATE_USER_USE_CASE",
        "CREATE_ORGANIZATION_USE_CASE",
        "ADD_USER_TO_ORGANIZATION_USE_CASE",
      ],
    },
    {
      provide: OrganizationFacade,
      useFactory: (
        organizationService: OrganizationService,
        getUserDetailsUseCase: GetUserDetailsUseCase
      ) => new OrganizationFacade(organizationService, getUserDetailsUseCase),
      inject: ["ORGANIZATION_SERVICE", "GET_USER_DETAILS_USE_CASE"],
    },
    {
      provide: "EVENT_HANDLER_REGISTRY",
      useFactory: (logger: ILoggerService, eventStore: IEventStore) =>
        new EventHandlerRegistry(eventStore, logger),
      inject: ["LOGGER_SERVICE", EventStore],
    },
  ],
  exports: [OrganizationFacade, "MEMBERSHIP_REPOSITORY", "USER_REPOSITORY"],
})
export class OrganizationModule {}
