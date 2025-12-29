import { Module, forwardRef } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
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
import { AcceptInvitationUseCase } from "./application/use-cases/accept-invitation.use-case";
import { ValidateInvitationUseCase } from "./application/use-cases/validate-invitation.use-case";
import { InvitationRepository } from "./infrastructure/repositories/invitation.repository";
import { OrganizationController } from "./interface/controllers/organization.controller";
import { GetUserMembershipsUseCase } from "./application/use-cases/get-user-membership.use-case";
import { GetOrganizationUseCase } from "./application/use-cases/GetOrganization.use-case";
import { OrganizationAuthorizationService } from "./domain/services/organization-authorization.service";
import { UpdateMemberRoleUseCase } from "./application/use-cases/UpdateMemberRole.use-case";
import { RemoveMemberUseCase } from "./application/use-cases/RemoveMember.use-case";
import { GetOrganizationMembersUseCase } from "./application/use-cases/GetOrganizationMembers.use-case";
import { GetOrganizationStatsUseCase } from "./application/use-cases/GetOrganizationStats.use-case";
import { ClassModule } from "../class/class.module";
import { SubjectModule } from "../subject/subject.module";
import { QuizModule } from "../quiz/quiz.module";
import { IClassRepository } from "../class/domain/repositories/class.repository";
import { ISubjectRepository } from "../subject/domain/repositories/subject.repository";
import { IQuizRepository } from "../quiz/domain/repositories/quiz.repository";
import { IResponseRepository } from "../quiz/domain/repositories/response.repository";
import { ClassRepository } from "../class/infrastructure/repositories/class.repository";
import { SubjectRepository } from "../subject/infrastructure/repositories/subject.repository";
import { AuthIdentityModel } from "../auth/infrastructure/models/authIdentity.model";
import { AuthIdentityRepository } from "../auth/infrastructure/repositories/authIdentity.repository";
import { IAuthIdentityRepository } from "../auth/domain/repositories/authIdentity.repository";
import { IRefreshTokenRepository } from "../auth/domain/repositories/refreshToken.repository";
import { RefreshTokenRepository } from "../auth/infrastructure/repositories/refreshToken.repository";
// @ts-ignore - Circular dependency resolved with forwardRef
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserModel,
      OrganizationModel,
      MembershipModel,
      InvitationModel,
      AuthIdentityModel,
    ]),
    forwardRef(() => CoreModule),
    forwardRef(() => AuthModule),
    forwardRef(() => ClassModule),
    forwardRef(() => SubjectModule),
    forwardRef(() => QuizModule),
  ],
  controllers: [OrganizationController, UserController],
  providers: [
    LoggerService,
    {
      provide: UserRepository,
      useFactory: (
        ormRepository: Repository<UserModel>,
        unitOfWork: IUnitOfWork
      ) => new UserRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(UserModel), TypeOrmUnitOfWork],
    },
    {
      provide: "USER_REPOSITORY",
      useFactory: (
        ormRepository: Repository<UserModel>,
        unitOfWork: IUnitOfWork
      ) => new UserRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(UserModel), TypeOrmUnitOfWork],
    },
    {
      provide: OrganizationRepository,
      useFactory: (
        ormRepository: Repository<OrganizationModel>,
        unitOfWork: IUnitOfWork
      ) => new OrganizationRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(OrganizationModel), TypeOrmUnitOfWork],
    },
    {
      provide: MembershipRepository,
      useFactory: (
        ormRepository: Repository<MembershipModel>,
        unitOfWork: IUnitOfWork
      ) => new MembershipRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(MembershipModel), TypeOrmUnitOfWork],
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
      provide: InvitationRepository,
      useFactory: (
        ormRepository: Repository<InvitationModel>,
        unitOfWork: IUnitOfWork
      ) => new InvitationRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(InvitationModel), TypeOrmUnitOfWork],
    },
    {
      provide: "AUTH_IDENTITY_REPOSITORY",
      useFactory: (ormRepository: Repository<AuthIdentityModel>) =>
        new AuthIdentityRepository(ormRepository),
      inject: [getRepositoryToken(AuthIdentityModel)],
    },
    {
      provide: CreateUserUseCase,
      useFactory: (
        logger: LoggerService,
        eventStore: EventStore,
        userRepository: IUserRepository
      ) => new CreateUserUseCase(logger, eventStore, userRepository),
      inject: [LoggerService, EventStore, UserRepository],
    },
    {
      provide: CreateOrganizationUseCase,
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
      inject: [LoggerService, EventStore, OrganizationRepository],
    },
    {
      provide: AddUserToOrganizationUseCase,
      useFactory: (
        logger: ILoggerService,
        membershipRepository: IMembershipRepository
      ) => new AddUserToOrganizationUseCase(logger, membershipRepository),
      inject: [LoggerService, MembershipRepository],
    },
    {
      provide: GetUserDetailsUseCase,
      useFactory: (logger: ILoggerService, userRepository: IUserRepository) =>
        new GetUserDetailsUseCase(logger, userRepository),
      inject: [LoggerService, UserRepository],
    },
    {
      provide: GetUserMembershipsUseCase,
      useFactory: (
        logger: ILoggerService,
        membershipRepository: IMembershipRepository
      ) => new GetUserMembershipsUseCase(logger, membershipRepository),
      inject: [LoggerService, MembershipRepository],
    },
    {
      provide: OrganizationAuthorizationService,
      useFactory: (userRepository: IUserRepository) =>
        new OrganizationAuthorizationService(userRepository),
      inject: [UserRepository],
    },
    {
      provide: GetOrganizationUseCase,
      useFactory: (
        logger: ILoggerService,
        organizationRepository: OrganizationRepository,
        organizationAuthorizationService: OrganizationAuthorizationService
      ) =>
        new GetOrganizationUseCase(
          logger,
          organizationRepository,
          organizationAuthorizationService
        ),
      inject: [
        LoggerService,
        OrganizationRepository,
        OrganizationAuthorizationService,
      ],
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
        LoggerService,
        EventStore,
        InvitationAuthorizationService,
        UserRepository,
        OrganizationRepository,
        InvitationRepository,
      ],
    },
    {
      provide: AcceptInvitationUseCase,
      useFactory: (
        logger: ILoggerService,
        eventStore: IEventStore,
        invitationRepository: IInvitationRepository,
        userRepository: IUserRepository,
        membershipRepository: IMembershipRepository,
        unitOfWork: IUnitOfWork
      ) =>
        new AcceptInvitationUseCase(
          logger,
          eventStore,
          invitationRepository,
          userRepository,
          membershipRepository,
          unitOfWork
        ),
      inject: [
        LoggerService,
        EventStore,
        InvitationRepository,
        UserRepository,
        MembershipRepository,
        TypeOrmUnitOfWork,
      ],
    },
    {
      provide: ValidateInvitationUseCase,
      useFactory: (
        logger: ILoggerService,
        invitationRepository: IInvitationRepository,
        userRepository: IUserRepository,
        membershipRepository: IMembershipRepository,
        unitOfWork: IUnitOfWork
      ) =>
        new ValidateInvitationUseCase(
          logger,
          invitationRepository,
          userRepository,
          membershipRepository,
          unitOfWork
        ),
      inject: [
        LoggerService,
        InvitationRepository,
        UserRepository,
        MembershipRepository,
        TypeOrmUnitOfWork,
      ],
    },
    {
      provide: UpdateMemberRoleUseCase,
      useFactory: (
        logger: ILoggerService,
        membershipRepository: IMembershipRepository,
        unitOfWork: IUnitOfWork
      ) => new UpdateMemberRoleUseCase(logger, membershipRepository, unitOfWork),
      inject: [LoggerService, MembershipRepository, TypeOrmUnitOfWork],
    },
    {
      provide: RemoveMemberUseCase,
      useFactory: (
        logger: ILoggerService,
        membershipRepository: IMembershipRepository,
        userRepository: IUserRepository,
        refreshTokenRepository: IRefreshTokenRepository,
        unitOfWork: IUnitOfWork
      ) =>
        new RemoveMemberUseCase(
          logger,
          membershipRepository,
          userRepository,
          refreshTokenRepository,
          unitOfWork
        ),
      inject: [
        LoggerService,
        MembershipRepository,
        UserRepository,
        RefreshTokenRepository,
        TypeOrmUnitOfWork,
      ],
    },
    {
      provide: GetOrganizationMembersUseCase,
      useFactory: (
        logger: ILoggerService,
        membershipRepository: IMembershipRepository
      ) => new GetOrganizationMembersUseCase(logger, membershipRepository),
      inject: [LoggerService, MembershipRepository],
    },
    {
      provide: GetOrganizationStatsUseCase,
      useFactory: (
        logger: ILoggerService,
        membershipRepository: IMembershipRepository,
        classRepository: IClassRepository,
        subjectRepository: ISubjectRepository,
        quizRepository: IQuizRepository,
        responseRepository: IResponseRepository
      ) => new GetOrganizationStatsUseCase(
        logger,
        membershipRepository,
        classRepository,
        subjectRepository,
        quizRepository,
        responseRepository
      ),
      inject: [
        LoggerService,
        MembershipRepository,
        "CLASS_REPOSITORY",
        "SUBJECT_REPOSITORY",
        "QUIZ_REPOSITORY",
        "RESPONSE_REPOSITORY",
      ],
    },
    {
      provide: OrganizationService,
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
        LoggerService,
        EventStore,
        TypeOrmUnitOfWork,
        CreateUserUseCase,
        CreateOrganizationUseCase,
        AddUserToOrganizationUseCase,
      ],
    },
    {
      provide: OrganizationFacade,
      useFactory: (
        organizationService: OrganizationService,
        getUserDetailsUseCase: GetUserDetailsUseCase,
        getUserMembershipsUseCase: GetUserMembershipsUseCase,
        userRepository: IUserRepository,
        getOrganizationUseCase: GetOrganizationUseCase,
        sendUserInvitaionUsecase: SendInvitationUseCase,
        acceptInvitationUseCase: AcceptInvitationUseCase,
        validateInvitationUseCase: ValidateInvitationUseCase,
        invitationRepository: IInvitationRepository,
        createUserUseCase: CreateUserUseCase,
        addUserToOrganizationUseCase: AddUserToOrganizationUseCase,
        unitOfWork: IUnitOfWork,
        membershipRepository: IMembershipRepository,
        updateMemberRoleUseCase: UpdateMemberRoleUseCase,
        removeMemberUseCase: RemoveMemberUseCase,
        getOrganizationMembersUseCase: GetOrganizationMembersUseCase,
        getOrganizationStatsUseCase: GetOrganizationStatsUseCase
      ) =>
        new OrganizationFacade(
          organizationService,
          getUserDetailsUseCase,
          getUserMembershipsUseCase,
          userRepository,
          getOrganizationUseCase,
          sendUserInvitaionUsecase,
          acceptInvitationUseCase,
          validateInvitationUseCase,
          invitationRepository,
          createUserUseCase,
          addUserToOrganizationUseCase,
          unitOfWork,
          membershipRepository,
          updateMemberRoleUseCase,
          removeMemberUseCase,
          getOrganizationMembersUseCase,
          getOrganizationStatsUseCase
        ),
      inject: [
        OrganizationService,
        GetUserDetailsUseCase,
        GetUserMembershipsUseCase,
        UserRepository,
        GetOrganizationUseCase,
        SendInvitationUseCase,
        AcceptInvitationUseCase,
        ValidateInvitationUseCase,
        InvitationRepository,
        CreateUserUseCase,
        AddUserToOrganizationUseCase,
        TypeOrmUnitOfWork,
        MembershipRepository,
        UpdateMemberRoleUseCase,
        RemoveMemberUseCase,
        GetOrganizationMembersUseCase,
        GetOrganizationStatsUseCase,
      ],
    },
    {
      provide: "EVENT_HANDLER_REGISTRY",
      useFactory: (logger: ILoggerService, eventStore: IEventStore) =>
        new EventHandlerRegistry(eventStore, logger),
      inject: [LoggerService, EventStore],
    },
  ],
  exports: [OrganizationFacade, "MEMBERSHIP_REPOSITORY"],
})
export class OrganizationModule {}
