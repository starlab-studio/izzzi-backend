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
import { ClassDomainService } from "./domain/services/class.domain.service";
import { CreateClassUseCase } from "./application/use-cases/CreateClass.use-case";
import { ClassController } from "./interface/controllers/class.controller";
import { IClassRepository } from "./domain/repositories/class.repository";
import { ClassRepository } from "./infrastructure/repositories/class.repository";
import { ClassFacade } from "./application/facades/class.facade";
import { OrganizationModule } from "../organization/organization.module";
import { IMembershipRepository } from "src/modules/organization/domain/repositories/membership.repository";
import { ClassService } from "./application/services/class.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassModel]),
    CoreModule,
    OrganizationModule,
  ],
  controllers: [ClassController],
  providers: [
    { provide: "LOGGER_SERVICE", useClass: LoggerService },
    { provide: "CLASS_DOMAIN_SERVICE", useClass: ClassDomainService },
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
        classDomainService: ClassDomainService,
        classRepository: IClassRepository,
        membershipRepository: IMembershipRepository,
      ) =>
        new CreateClassUseCase(
          logger,
          classDomainService,
          classRepository,
          membershipRepository,
        ),
      inject: [
        "LOGGER_SERVICE",
        "CLASS_DOMAIN_SERVICE",
        "CLASS_REPOSITORY",
        "MEMBERSHIP_REPOSITORY",
      ],
    },
    {
      provide: ClassService,
      useFactory: (
        logger: LoggerService,
        eventStore: EventStore,
        unitOfWork: IUnitOfWork,
        createClassUseCase: CreateClassUseCase,
      ) => new ClassService(logger, eventStore, unitOfWork, createClassUseCase),
      inject: [
        "LOGGER_SERVICE",
        EventStore,
        TypeOrmUnitOfWork,
        "CREATE_CLASS_USE_CASE",
      ],
    },
    {
      provide: ClassFacade,
      useFactory: (classService: ClassService) => new ClassFacade(classService),
      inject: [ClassService],
    },
  ],
  exports: [ClassFacade],
})
export class ClassModule {}
