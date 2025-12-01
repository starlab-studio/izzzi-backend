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

@Module({
  imports: [TypeOrmModule.forFeature([ClassModel]), CoreModule],
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
        eventStore: EventStore,
        classDomainService: ClassDomainService,
        classRepository: IClassRepository,
      ) =>
        new CreateClassUseCase(
          logger,
          eventStore,
          classDomainService,
          classRepository,
        ),
      inject: [
        "LOGGER_SERVICE",
        EventStore,
        "CLASS_DOMAIN_SERVICE",
        "CLASS_REPOSITORY",
      ],
    },
    {
      provide: ClassFacade,
      useFactory: (
        createClassUseCase: CreateClassUseCase,
        eventStore: EventStore,
        unitOfWork: IUnitOfWork,
      ) => new ClassFacade(createClassUseCase, eventStore, unitOfWork),
      inject: ["CREATE_CLASS_USE_CASE", EventStore, TypeOrmUnitOfWork],
    },
  ],
  exports: [ClassFacade],
})
export class ClassModule {}
