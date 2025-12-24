import { Module, forwardRef } from "@nestjs/common";
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
import { GetSubjectsByClassUseCase } from "./application/use-cases/GetSubjectsByClass.use-case";
import { UpdateSubjectUseCase } from "./application/use-cases/UpdateSubject.use-case";
import { DeleteSubjectUseCase } from "./application/use-cases/DeleteSubject.use-case";
import { BulkCreateSubjectsUseCase } from "./application/use-cases/BulkCreateSubjects.use-case";
import { SubjectController } from "./interface/controllers/subject.controller";
import { ISubjectRepository } from "./domain/repositories/subject.repository";
import { SubjectAssignmentRepository } from "./infrastructure/repositories/subject-assignment.repository";
import { SubjectRepository } from "./infrastructure/repositories/subject.repository";

import { SubjectFacade } from "./application/facades/subject.facade";
import { MembershipModel } from "src/modules/organization/infrastructure/models/membership.model";
import { MembershipRepository } from "src/modules/organization/infrastructure/repositories/membership.repository";
import { IMembershipRepository } from "src/modules/organization/domain/repositories/membership.repository";
import { ClassModule } from "../class/class.module";
import { IClassRepository } from "../class/domain/repositories/class.repository";
import { ISubjectAssignmentRepository } from "./domain/repositories/subject-assignment.repository";
import { OrganizationFacade } from "../organization/application/facades/organization.facade";
import { SubjectCreatedEventHandler } from "./application/handlers/subject-created.handler";
import { EventHandlerRegistry } from "src/core";
import { CreateEmailNotificationUseCase } from "src/modules/notification/application/use-cases/create-email-notification.use-case";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubjectModel,
      SubjectAssignmentModel,
      MembershipModel,
    ]),
    forwardRef(() => CoreModule),
    NotificationModule,
    forwardRef(() => OrganizationModule),
    forwardRef(() => ClassModule),
  ],
  controllers: [SubjectController],
  providers: [
    LoggerService,
    {
      provide: SubjectRepository,
      useFactory: (
        ormRepository: Repository<SubjectModel>,
        unitOfWork: IUnitOfWork,
      ) => new SubjectRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(SubjectModel), TypeOrmUnitOfWork],
    },
    {
      provide: "SUBJECT_REPOSITORY",
      useExisting: SubjectRepository,
    },
    {
      provide: SubjectAssignmentRepository,
      useFactory: (
        ormRepository: Repository<SubjectAssignmentModel>,
        unitOfWork: IUnitOfWork,
      ) => new SubjectAssignmentRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(SubjectAssignmentModel), TypeOrmUnitOfWork],
    },
    {
      provide: "SUBJECT_ASSIGNMENT_REPOSITORY",
      useExisting: SubjectAssignmentRepository,
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
      provide: CreateSubjectUseCase,
      useFactory: (
        logger: ILoggerService,
        classRepository: IClassRepository,
        subjectRepository: ISubjectRepository,
        subjectAssignmentRepository: ISubjectAssignmentRepository,
        organizationFacade: OrganizationFacade,
        eventStore: EventStore,
      ) =>
        new CreateSubjectUseCase(
          logger,
          classRepository,
          subjectRepository,
          subjectAssignmentRepository,
          organizationFacade,
          eventStore,
        ),
      inject: [
        LoggerService,
        "CLASS_REPOSITORY",
        SubjectRepository,
        SubjectAssignmentRepository,
        OrganizationFacade,
        EventStore,
      ],
    },
    {
      provide: GetSubjectsByClassUseCase,
      useFactory: (
        logger: ILoggerService,
        classRepository: IClassRepository,
        subjectRepository: ISubjectRepository,
        subjectAssignmentRepository: ISubjectAssignmentRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new GetSubjectsByClassUseCase(
          logger,
          classRepository,
          subjectRepository,
          subjectAssignmentRepository,
          organizationFacade,
        ),
      inject: [
        LoggerService,
        "CLASS_REPOSITORY",
        SubjectRepository,
        SubjectAssignmentRepository,
        OrganizationFacade,
      ],
    },
    {
      provide: UpdateSubjectUseCase,
      useFactory: (
        logger: ILoggerService,
        subjectRepository: ISubjectRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new UpdateSubjectUseCase(
          logger,
          subjectRepository,
          organizationFacade,
        ),
      inject: [
        LoggerService,
        SubjectRepository,
        OrganizationFacade,
      ],
    },
    {
      provide: DeleteSubjectUseCase,
      useFactory: (
        logger: ILoggerService,
        subjectRepository: ISubjectRepository,
        subjectAssignmentRepository: ISubjectAssignmentRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new DeleteSubjectUseCase(
          logger,
          subjectRepository,
          subjectAssignmentRepository,
          organizationFacade,
        ),
      inject: [
        LoggerService,
        SubjectRepository,
        SubjectAssignmentRepository,
        OrganizationFacade,
      ],
    },
    {
      provide: BulkCreateSubjectsUseCase,
      useFactory: (
        logger: ILoggerService,
        createSubjectUseCase: CreateSubjectUseCase,
      ) =>
        new BulkCreateSubjectsUseCase(
          logger,
          createSubjectUseCase,
        ),
      inject: [
        LoggerService,
        CreateSubjectUseCase,
      ],
    },
    {
      provide: SubjectFacade,
      useFactory: (
        createSubjectUseCase: CreateSubjectUseCase,
        getSubjectsByClassUseCase: GetSubjectsByClassUseCase,
        updateSubjectUseCase: UpdateSubjectUseCase,
        deleteSubjectUseCase: DeleteSubjectUseCase,
        bulkCreateSubjectsUseCase: BulkCreateSubjectsUseCase,
      ) => new SubjectFacade(
        createSubjectUseCase,
        getSubjectsByClassUseCase,
        updateSubjectUseCase,
        deleteSubjectUseCase,
        bulkCreateSubjectsUseCase,
      ),
      inject: [
        CreateSubjectUseCase,
        GetSubjectsByClassUseCase,
        UpdateSubjectUseCase,
        DeleteSubjectUseCase,
        BulkCreateSubjectsUseCase,
      ],
    },
    {
      provide: SubjectCreatedEventHandler,
      useFactory: (
        logger: ILoggerService,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase,
      ) => new SubjectCreatedEventHandler(logger, createEmailNotificationUseCase),
      inject: [LoggerService, CreateEmailNotificationUseCase],
    },
  ],
  exports: [
    SubjectFacade,
    SubjectRepository,
    SubjectAssignmentRepository,
    "SUBJECT_REPOSITORY",
    "SUBJECT_ASSIGNMENT_REPOSITORY",
  ],
})
export class SubjectModule {
  constructor(
    private readonly eventHandlerRegistry: EventHandlerRegistry,
    private readonly subjectCreatedEventHandler: SubjectCreatedEventHandler,
  ) {}

  async onModuleInit() {
    this.eventHandlerRegistry.registerHandler(
      "subject.created",
      this.subjectCreatedEventHandler,
    );
  }
}
