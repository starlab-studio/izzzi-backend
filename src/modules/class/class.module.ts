import { Module } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  LoggerService,
  EventStore,
  TypeOrmUnitOfWork,
  IUnitOfWork,
} from "src/core";
import { CoreModule } from "src/core/core.module";
import { ClassModel } from "./infrastructure/models/class.model";
import { CreateClassUseCase } from "./application/use-cases/CreateClass.use-case";
import { GetClassesByOrganizationUseCase } from "./application/use-cases/GetClassesByOrganization.use-case";
import { GetClassByIdUseCase } from "./application/use-cases/GetClassById.use-case";
import { UpdateClassUseCase } from "./application/use-cases/UpdateClass.use-case";
import { ArchiveClassUseCase } from "./application/use-cases/ArchiveClass.use-case";
import { ClassController } from "./interface/controllers/class.controller";
import { IClassRepository } from "./domain/repositories/class.repository";
import { ClassRepository } from "./infrastructure/repositories/class.repository";
import { ClassFacade } from "./application/facades/class.facade";
import { OrganizationModule } from "../organization/organization.module";
import { OrganizationFacade } from "../organization/application/facades/organization.facade";

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassModel]),
    CoreModule,
    OrganizationModule,
  ],
  controllers: [ClassController],
  providers: [
    { provide: "LOGGER_SERVICE", useClass: LoggerService },
    {
      provide: "CLASS_REPOSITORY",
      useFactory: (
        ormRepository: Repository<ClassModel>,
        unitOfWork: IUnitOfWork,
      ) => new ClassRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(ClassModel), TypeOrmUnitOfWork],
    },
    {
      provide: "CREATE_CLASS_USE_CASE",
      useFactory: (
        logger: LoggerService,
        classRepository: IClassRepository,
        organizationFacade: OrganizationFacade,
        eventStore: EventStore,
      ) =>
        new CreateClassUseCase(
          logger,
          classRepository,
          organizationFacade,
          eventStore,
        ),
      inject: [
        "LOGGER_SERVICE",
        "CLASS_REPOSITORY",
        OrganizationFacade,
        EventStore,
      ],
    },
    {
      provide: "GET_CLASSES_BY_ORGANIZATION_USE_CASE",
      useFactory: (
        logger: LoggerService,
        classRepository: IClassRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new GetClassesByOrganizationUseCase(
          logger,
          classRepository,
          organizationFacade,
        ),
      inject: [
        "LOGGER_SERVICE",
        "CLASS_REPOSITORY",
        OrganizationFacade,
      ],
    },
    {
      provide: "GET_CLASS_BY_ID_USE_CASE",
      useFactory: (
        logger: LoggerService,
        classRepository: IClassRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new GetClassByIdUseCase(
          logger,
          classRepository,
          organizationFacade,
        ),
      inject: [
        "LOGGER_SERVICE",
        "CLASS_REPOSITORY",
        OrganizationFacade,
      ],
    },
    {
      provide: "UPDATE_CLASS_USE_CASE",
      useFactory: (
        logger: LoggerService,
        classRepository: IClassRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new UpdateClassUseCase(
          logger,
          classRepository,
          organizationFacade,
        ),
      inject: [
        "LOGGER_SERVICE",
        "CLASS_REPOSITORY",
        OrganizationFacade,
      ],
    },
    {
      provide: "ARCHIVE_CLASS_USE_CASE",
      useFactory: (
        logger: LoggerService,
        classRepository: IClassRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new ArchiveClassUseCase(
          logger,
          classRepository,
          organizationFacade,
        ),
      inject: [
        "LOGGER_SERVICE",
        "CLASS_REPOSITORY",
        OrganizationFacade,
      ],
    },
    {
      provide: ClassFacade,
      useFactory: (
        createClassUseCase: CreateClassUseCase,
        getClassesByOrganizationUseCase: GetClassesByOrganizationUseCase,
        getClassByIdUseCase: GetClassByIdUseCase,
        updateClassUseCase: UpdateClassUseCase,
        archiveClassUseCase: ArchiveClassUseCase,
      ) =>
        new ClassFacade(
          createClassUseCase,
          getClassesByOrganizationUseCase,
          getClassByIdUseCase,
          updateClassUseCase,
          archiveClassUseCase,
        ),
      inject: [
        "CREATE_CLASS_USE_CASE",
        "GET_CLASSES_BY_ORGANIZATION_USE_CASE",
        "GET_CLASS_BY_ID_USE_CASE",
        "UPDATE_CLASS_USE_CASE",
        "ARCHIVE_CLASS_USE_CASE",
      ],
    },
  ],
  exports: [ClassFacade],
})
export class ClassModule {}
