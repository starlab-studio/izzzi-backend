import { Module, forwardRef } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";

import { LoggerService, ILoggerService, IUnitOfWork, TypeOrmUnitOfWork } from "src/core";
import { CoreModule } from "src/core/core.module";
import { OrganizationModule } from "../organization/organization.module";
import { AuthModule } from "../auth/auth.module";
import { UserModel } from "../organization/infrastructure/models/user.model";
import { OrganizationModel } from "../organization/infrastructure/models/organization.model";
import { UserRepository } from "../organization/infrastructure/repositories/user.repository";
import { OrganizationRepository } from "../organization/infrastructure/repositories/organization.repository";
import { IUserRepository } from "../organization/domain/repositories/user.repository";
import { IOrganizationRepository } from "../organization/domain/repositories/organization.repository";
import { AuthIdentityRepository } from "../auth/infrastructure/repositories/authIdentity.repository";
import { IAuthIdentityRepository } from "../auth/domain/repositories/authIdentity.repository";
import { AuthIdentityUniquenessService } from "../auth/domain/services/authIdentity-uniqueness.service";
import { AuthIdentityModel } from "../auth/infrastructure/models/authIdentity.model";
import { OrganizationFacade } from "../organization/application/facades/organization.facade";
import { AuthFacade } from "../auth/application/facades/auth.facade";
import { IAuthStrategy } from "../auth/domain/types";
import { GetProfileUseCase } from "./application/use-cases/GetProfile.use-case";
import { MembershipRepository } from "../organization/infrastructure/repositories/membership.repository";
import { MembershipModel } from "../organization/infrastructure/models/membership.model";
import { IMembershipRepository } from "../organization/domain/repositories/membership.repository";
import { UpdateProfileUseCase } from "./application/use-cases/UpdateProfile.use-case";
import { DeleteAccountUseCase } from "./application/use-cases/DeleteAccount.use-case";
import { UserFacade } from "./application/facades/user.facade";
import { ProfileController } from "./interface/controllers/profile.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserModel, OrganizationModel, AuthIdentityModel, MembershipModel]),
    forwardRef(() => CoreModule),
    forwardRef(() => OrganizationModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [ProfileController],
  providers: [
    LoggerService,
    ConfigService,
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
      provide: "AUTH_IDENTITY_REPOSITORY",
      useFactory: (ormRepository: Repository<AuthIdentityModel>) =>
        new AuthIdentityRepository(ormRepository),
      inject: [getRepositoryToken(AuthIdentityModel)],
    },
    {
      provide: AuthIdentityUniquenessService,
      useFactory: (authIdentityRepository: IAuthIdentityRepository) =>
        new AuthIdentityUniquenessService(authIdentityRepository),
      inject: ["AUTH_IDENTITY_REPOSITORY"],
    },
    {
      provide: GetProfileUseCase,
      useFactory: (
        logger: ILoggerService,
        userRepository: IUserRepository
      ) => new GetProfileUseCase(logger, userRepository),
      inject: [LoggerService, "USER_REPOSITORY"],
    },
    {
      provide: UpdateProfileUseCase,
      useFactory: (
        logger: ILoggerService,
        unitOfWork: IUnitOfWork,
        userRepository: IUserRepository,
        authIdentityRepository: IAuthIdentityRepository,
        authIdentityUniquenessService: AuthIdentityUniquenessService,
        organizationRepository: IOrganizationRepository,
        organizationFacade: OrganizationFacade
      ) =>
        new UpdateProfileUseCase(
          logger,
          unitOfWork,
          userRepository,
          authIdentityRepository,
          authIdentityUniquenessService,
          organizationRepository,
          organizationFacade
        ),
      inject: [
        LoggerService,
        TypeOrmUnitOfWork,
        "USER_REPOSITORY",
        "AUTH_IDENTITY_REPOSITORY",
        AuthIdentityUniquenessService,
        "ORGANIZATION_REPOSITORY",
        OrganizationFacade,
      ],
    },
    {
      provide: DeleteAccountUseCase,
      useFactory: (
        logger: ILoggerService,
        unitOfWork: IUnitOfWork,
        userRepository: IUserRepository,
        authIdentityRepository: IAuthIdentityRepository,
        organizationRepository: IOrganizationRepository,
        membershipRepository: IMembershipRepository,
        authStrategy: IAuthStrategy
      ) =>
        new DeleteAccountUseCase(
          logger,
          unitOfWork,
          userRepository,
          authIdentityRepository,
          organizationRepository,
          membershipRepository,
          authStrategy
        ),
        inject: [
          LoggerService,
          TypeOrmUnitOfWork,
          "USER_REPOSITORY",
          "AUTH_IDENTITY_REPOSITORY",
          "ORGANIZATION_REPOSITORY",
          "MEMBERSHIP_REPOSITORY",
          "AUTH_IDENTITY_PROVIDER",
        ],
    },
    {
      provide: UserFacade,
      useFactory: (
        getProfileUseCase: GetProfileUseCase,
        updateProfileUseCase: UpdateProfileUseCase,
        deleteAccountUseCase: DeleteAccountUseCase
      ) =>
        new UserFacade(
          getProfileUseCase,
          updateProfileUseCase,
          deleteAccountUseCase
        ),
      inject: [GetProfileUseCase, UpdateProfileUseCase, DeleteAccountUseCase],
    },
  ],
  exports: [UserFacade],
})
export class UserModule {}

