import { Module } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  ILoggerService,
  LoggerService,
  EventStore,
  EventHandlerRegistry,
  TypeOrmUnitOfWork,
  IUnitOfWork,
} from "src/core";
import { CoreModule } from "src/core/core.module";
import { NotificationModule } from "../notification/notification.module";

import { SubjectModel } from "./infrastructure/models/subject.model";
import { SubjectDomainService } from "./domain/services/subject.domain.service";
import { CreateSubjectUseCase } from "./application/use-cases/CreateSubject.use-case";
import { SubjectController } from "./interface/controllers/subject.controller";
import { ISubjectRepository } from "./domain/repositories/subject.repository";
import { SubjectRepository } from "./infrastructure/repositories/subject.repository";
import { SubjectFacade } from "./application/facades/subject.facade";
import { SubjectCreatedEventHandler } from "./application/handlers/subject-created.handler";
import { CreateEmailNotificationUseCase } from "../notification/application/use-cases/create-email-notification.use-case";

@Module({
  imports: [
    TypeOrmModule.forFeature([SubjectModel]),
    CoreModule,
    NotificationModule,
  ],
  controllers: [SubjectController],
  providers: [
    { provide: "LOGGER_SERVICE", useClass: LoggerService },
    { provide: "SUBJECT_DOMAIN_SERVICE", useClass: SubjectDomainService },
    {
      provide: "SUBJECT_REPOSITORY",
      useFactory: (
        ormRepository: Repository<SubjectModel>,
        unitOfWork: IUnitOfWork,
      ) => new SubjectRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(SubjectModel), TypeOrmUnitOfWork],
    },
    {
      provide: "CREATE_SUBJECT_USE_CASE",
      useFactory: (
        logger: ILoggerService,
        subjectDomainService: SubjectDomainService,
        subjectRepository: ISubjectRepository,
      ) =>
        new CreateSubjectUseCase(
          logger,
          subjectDomainService,
          subjectRepository,
        ),
      inject: [
        "LOGGER_SERVICE",
        "SUBJECT_DOMAIN_SERVICE",
        "SUBJECT_REPOSITORY",
      ],
    },
    {
      provide: SubjectFacade,
      useFactory: (
        createSubjectUseCase: CreateSubjectUseCase,
        eventStore: EventStore,
      ) => new SubjectFacade(createSubjectUseCase, eventStore),
      inject: ["CREATE_SUBJECT_USE_CASE", EventStore],
    },
    {
      provide: SubjectCreatedEventHandler,
      useFactory: (
        logger: ILoggerService,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase,
      ) =>
        new SubjectCreatedEventHandler(logger, createEmailNotificationUseCase),
      inject: [LoggerService, CreateEmailNotificationUseCase],
    },
  ],
  exports: [SubjectFacade],
})
export class SubjectModule {
  constructor(
    private readonly eventHandlerRegistry: EventHandlerRegistry,
    private readonly subjectCreatedEventHandler: SubjectCreatedEventHandler,
  ) {}

  onModuleInit() {
    this.eventHandlerRegistry.registerHandler(
      "subject.created",
      this.subjectCreatedEventHandler,
    );
  }
}
