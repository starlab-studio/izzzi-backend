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
import { ClassModel } from "./infrastructure/models/class.model";
import { ClassStudentModel } from "./infrastructure/models/class-student.model";
import { CreateClassUseCase } from "./application/use-cases/CreateClass.use-case";
import { GetClassesByOrganizationUseCase } from "./application/use-cases/GetClassesByOrganization.use-case";
import { GetClassByIdUseCase } from "./application/use-cases/GetClassById.use-case";
import { UpdateClassUseCase } from "./application/use-cases/UpdateClass.use-case";
import { ArchiveClassUseCase } from "./application/use-cases/ArchiveClass.use-case";
import { ClassController } from "./interface/controllers/class.controller";
import { IClassRepository } from "./domain/repositories/class.repository";
import { ClassRepository } from "./infrastructure/repositories/class.repository";
import { IClassStudentRepository } from "./domain/repositories/class-student.repository";
import { ClassStudentRepository } from "./infrastructure/repositories/class-student.repository";
import { ClassFacade } from "./application/facades/class.facade";
import { OrganizationModule } from "../organization/organization.module";
import { OrganizationFacade } from "../organization/application/facades/organization.facade";
import { SubscriptionModule } from "../subscription/subscription.module";
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from "../subscription/domain/repositories/subscription.repository";
import {
  ISubscriptionPlanRepository,
  SUBSCRIPTION_PLAN_REPOSITORY,
} from "../subscription/domain/repositories/subscription-plan.repository";
import { ClassLimitService } from "./domain/services/class-limit.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassModel, ClassStudentModel]),
    CoreModule,
    OrganizationModule,
    forwardRef(() => SubscriptionModule),
  ],
  controllers: [ClassController],
  providers: [
    LoggerService,
    {
      provide: ClassLimitService,
      useFactory: (
        subscriptionRepository: ISubscriptionRepository,
        subscriptionPlanRepository: ISubscriptionPlanRepository,
        classRepository: IClassRepository
      ) =>
        new ClassLimitService(
          subscriptionRepository,
          subscriptionPlanRepository,
          classRepository
        ),
      inject: [
        SUBSCRIPTION_REPOSITORY,
        SUBSCRIPTION_PLAN_REPOSITORY,
        ClassRepository,
      ],
    },
    {
      provide: ClassRepository,
      useFactory: (
        ormRepository: Repository<ClassModel>,
        unitOfWork: IUnitOfWork
      ) => new ClassRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(ClassModel), TypeOrmUnitOfWork],
    },
    {
      provide: "CLASS_REPOSITORY",
      useExisting: ClassRepository,
    },
    {
      provide: ClassStudentRepository,
      useFactory: (
        ormRepository: Repository<ClassStudentModel>,
        unitOfWork: IUnitOfWork
      ) => new ClassStudentRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(ClassStudentModel), TypeOrmUnitOfWork],
    },
    {
      provide: "CLASS_STUDENT_REPOSITORY",
      useExisting: ClassStudentRepository,
    },
    {
      provide: CreateClassUseCase,
      useFactory: (
        logger: ILoggerService,
        classRepository: IClassRepository,
        classStudentRepository: IClassStudentRepository,
        organizationFacade: OrganizationFacade,
        eventStore: EventStore,
        classLimitService: ClassLimitService,
        subscriptionRepository: ISubscriptionRepository,
        subscriptionPlanRepository: ISubscriptionPlanRepository
      ) =>
        new CreateClassUseCase(
          logger,
          classRepository,
          classStudentRepository,
          organizationFacade,
          eventStore,
          classLimitService,
          subscriptionRepository,
          subscriptionPlanRepository
        ),
      inject: [
        LoggerService,
        ClassRepository,
        ClassStudentRepository,
        OrganizationFacade,
        EventStore,
        ClassLimitService,
        SUBSCRIPTION_REPOSITORY,
        SUBSCRIPTION_PLAN_REPOSITORY,
      ],
    },
    {
      provide: GetClassesByOrganizationUseCase,
      useFactory: (
        logger: ILoggerService,
        classRepository: IClassRepository,
        classStudentRepository: IClassStudentRepository,
        organizationFacade: OrganizationFacade
      ) =>
        new GetClassesByOrganizationUseCase(
          logger,
          classRepository,
          classStudentRepository,
          organizationFacade
        ),
      inject: [
        LoggerService,
        ClassRepository,
        ClassStudentRepository,
        OrganizationFacade,
      ],
    },
    {
      provide: GetClassByIdUseCase,
      useFactory: (
        logger: ILoggerService,
        classRepository: IClassRepository,
        classStudentRepository: IClassStudentRepository,
        organizationFacade: OrganizationFacade
      ) =>
        new GetClassByIdUseCase(
          logger,
          classRepository,
          classStudentRepository,
          organizationFacade
        ),
      inject: [
        LoggerService,
        ClassRepository,
        ClassStudentRepository,
        OrganizationFacade,
      ],
    },
    {
      provide: UpdateClassUseCase,
      useFactory: (
        logger: ILoggerService,
        classRepository: IClassRepository,
        classStudentRepository: IClassStudentRepository,
        organizationFacade: OrganizationFacade
      ) =>
        new UpdateClassUseCase(
          logger,
          classRepository,
          classStudentRepository,
          organizationFacade
        ),
      inject: [
        LoggerService,
        ClassRepository,
        ClassStudentRepository,
        OrganizationFacade,
      ],
    },
    {
      provide: ArchiveClassUseCase,
      useFactory: (
        logger: ILoggerService,
        classRepository: IClassRepository,
        organizationFacade: OrganizationFacade,
        eventStore: EventStore
      ) =>
        new ArchiveClassUseCase(
          logger,
          classRepository,
          organizationFacade,
          eventStore
        ),
      inject: [LoggerService, ClassRepository, OrganizationFacade, EventStore],
    },
    {
      provide: ClassFacade,
      useFactory: (
        createClassUseCase: CreateClassUseCase,
        getClassesByOrganizationUseCase: GetClassesByOrganizationUseCase,
        getClassByIdUseCase: GetClassByIdUseCase,
        updateClassUseCase: UpdateClassUseCase,
        archiveClassUseCase: ArchiveClassUseCase
      ) =>
        new ClassFacade(
          createClassUseCase,
          getClassesByOrganizationUseCase,
          getClassByIdUseCase,
          updateClassUseCase,
          archiveClassUseCase
        ),
      inject: [
        CreateClassUseCase,
        GetClassesByOrganizationUseCase,
        GetClassByIdUseCase,
        UpdateClassUseCase,
        ArchiveClassUseCase,
      ],
    },
  ],
  exports: [
    ClassFacade,
    ClassRepository,
    ClassStudentRepository,
    "CLASS_REPOSITORY",
    "CLASS_STUDENT_REPOSITORY",
  ],
})
export class ClassModule {}
