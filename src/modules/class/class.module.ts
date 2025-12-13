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
import { ClassController } from "./interface/controllers/class.controller";
import { IClassRepository } from "./domain/repositories/class.repository";
import { ClassRepository } from "./infrastructure/repositories/class.repository";
import { ClassFacade } from "./application/facades/class.facade";
import { OrganizationModule } from "../organization/organization.module";
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";

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
        userRepository: IUserRepository,
        eventStore: EventStore,
      ) =>
        new CreateClassUseCase(
          logger,
          classRepository,
          userRepository,
          eventStore,
        ),
      inject: [
        "LOGGER_SERVICE",
        "CLASS_REPOSITORY",
        "USER_REPOSITORY",
        EventStore,
      ],
    },
    {
      provide: ClassFacade,
      useFactory: (createClassUseCase: CreateClassUseCase) =>
        new ClassFacade(createClassUseCase),
      inject: ["CREATE_CLASS_USE_CASE"],
    },
  ],
  exports: [ClassFacade],
})
export class ClassModule {}
