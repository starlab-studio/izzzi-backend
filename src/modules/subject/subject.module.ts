import { Module } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  ILoggerService,
  LoggerService,
  EventStore,
  TypeOrmUnitOfWork,
  IUnitOfWork,
} from "src/core";
import { CoreModule } from "src/core/core.module";
import { NotificationModule } from "../notification/notification.module";
import { OrganizationModule } from "src/modules/organization/organization.module";

import { SubjectModel } from "./infrastructure/models/subject.model";
import { SubjectAssignmentModel } from "./infrastructure/models/subject-assignment.model";
import { CreateSubjectUseCase } from "./application/use-cases/CreateSubject.use-case";
import { SubjectController } from "./interface/controllers/subject.controller";
import { ISubjectRepository } from "./domain/repositories/subject.repository";
import { SubjectAssignmentRepository } from "./infrastructure/repositories/subject-assignment.repository";
import { SubjectRepository } from "./infrastructure/repositories/subject.repository";

import { SubjectFacade } from "./application/facades/subject.facade";
import { MembershipModel } from "src/modules/organization/infrastructure/models/membership.model";
import { MembershipRepository } from "src/modules/organization/infrastructure/repositories/membership.repository";
import { IMembershipRepository } from "src/modules/organization/domain/repositories/membership.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubjectModel,
      SubjectAssignmentModel,
      MembershipModel,
    ]),
    CoreModule,
    NotificationModule,
    OrganizationModule,
  ],
  controllers: [SubjectController],
  providers: [
    { provide: "LOGGER_SERVICE", useClass: LoggerService },
    {
      provide: "SUBJECT_REPOSITORY",
      useFactory: (ormRepository: Repository<SubjectModel>) =>
        new SubjectRepository(ormRepository),
      inject: [getRepositoryToken(SubjectModel)],
    },
    {
      provide: "SUBJECT_ASSIGNMENT_REPOSITORY",
      useFactory: (ormRepository: Repository<SubjectAssignmentModel>) =>
        new SubjectAssignmentRepository(ormRepository),
      inject: [getRepositoryToken(SubjectAssignmentModel)],
    },
    {
      provide: "MEMBERSHIP_REPOSITORY",
      useFactory: (
        ormRepository: Repository<MembershipModel>,
        unitOfWork: IUnitOfWork,
      ) => new MembershipRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(MembershipModel), TypeOrmUnitOfWork],
    },
    {
      provide: "CREATE_SUBJECT_USE_CASE",
      useFactory: (
        logger: ILoggerService,
        subjectRepository: ISubjectRepository,
        membershipRepository: IMembershipRepository,
      ) =>
        new CreateSubjectUseCase(
          logger,
          subjectRepository,
          membershipRepository,
        ),
      inject: ["LOGGER_SERVICE", "SUBJECT_REPOSITORY", "MEMBERSHIP_REPOSITORY"],
    },
    {
      provide: SubjectFacade,
      useFactory: (
        createSubjectUseCase: CreateSubjectUseCase,
        eventStore: EventStore,
      ) => new SubjectFacade(createSubjectUseCase, eventStore),
      inject: ["CREATE_SUBJECT_USE_CASE", EventStore],
    },
  ],
  exports: [SubjectFacade],
})
export class SubjectModule {}
