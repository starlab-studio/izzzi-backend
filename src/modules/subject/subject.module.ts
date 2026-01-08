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
import { ClassModule } from "../class/class.module";
import { IClassRepository } from "../class/domain/repositories/class.repository";
import { ISubjectAssignmentRepository } from "./domain/repositories/subject-assignment.repository";
import { OrganizationFacade } from "../organization/application/facades/organization.facade";
import { QuizModule } from "../quiz/quiz.module";
import { SubscriptionModule } from "../subscription/subscription.module";
import { IQuizRepository } from "../quiz/domain/repositories/quiz.repository";
import { IResponseRepository } from "../quiz/domain/repositories/response.repository";
import { ResponseVisibilityService } from "../quiz/domain/services/response-visibility.service";
import { SubscriptionFeatureService } from "../subscription/domain/services/subscription-feature.service";
import { ISubscriptionRepository } from "../subscription/domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "../subscription/domain/repositories/subscription-plan.repository";
import { SUBSCRIPTION_REPOSITORY } from "../subscription/domain/repositories/subscription.repository";
import { SUBSCRIPTION_PLAN_REPOSITORY } from "../subscription/domain/repositories/subscription-plan.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubjectModel,
      SubjectAssignmentModel,
      MembershipModel,
    ]),
    forwardRef(() => CoreModule),
    forwardRef(() => OrganizationModule),
    forwardRef(() => ClassModule),
    forwardRef(() => QuizModule),
    forwardRef(() => SubscriptionModule),
  ],
  controllers: [SubjectController],
  providers: [
    LoggerService,
    {
      provide: SubjectRepository,
      useFactory: (
        ormRepository: Repository<SubjectModel>,
        unitOfWork: IUnitOfWork
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
        unitOfWork: IUnitOfWork
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
        unitOfWork: IUnitOfWork
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
        eventStore: EventStore
      ) =>
        new CreateSubjectUseCase(
          logger,
          classRepository,
          subjectRepository,
          subjectAssignmentRepository,
          organizationFacade,
          eventStore
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
        quizRepository: IQuizRepository,
        responseRepository: IResponseRepository,
        responseVisibilityService: ResponseVisibilityService,
        subscriptionFeatureService: SubscriptionFeatureService,
        subscriptionRepository: ISubscriptionRepository,
        subscriptionPlanRepository: ISubscriptionPlanRepository
      ) =>
        new GetSubjectsByClassUseCase(
          logger,
          classRepository,
          subjectRepository,
          subjectAssignmentRepository,
          organizationFacade,
          quizRepository,
          responseRepository,
          responseVisibilityService,
          subscriptionFeatureService,
          subscriptionRepository,
          subscriptionPlanRepository
        ),
      inject: [
        LoggerService,
        "CLASS_REPOSITORY",
        SubjectRepository,
        SubjectAssignmentRepository,
        OrganizationFacade,
        "QUIZ_REPOSITORY",
        "RESPONSE_REPOSITORY",
        ResponseVisibilityService,
        SubscriptionFeatureService,
        SUBSCRIPTION_REPOSITORY,
        SUBSCRIPTION_PLAN_REPOSITORY,
      ],
    },
    {
      provide: UpdateSubjectUseCase,
      useFactory: (
        logger: ILoggerService,
        subjectRepository: ISubjectRepository,
        organizationFacade: OrganizationFacade
      ) =>
        new UpdateSubjectUseCase(logger, subjectRepository, organizationFacade),
      inject: [LoggerService, SubjectRepository, OrganizationFacade],
    },
    {
      provide: DeleteSubjectUseCase,
      useFactory: (
        logger: ILoggerService,
        subjectRepository: ISubjectRepository,
        subjectAssignmentRepository: ISubjectAssignmentRepository,
        organizationFacade: OrganizationFacade
      ) =>
        new DeleteSubjectUseCase(
          logger,
          subjectRepository,
          subjectAssignmentRepository,
          organizationFacade
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
        createSubjectUseCase: CreateSubjectUseCase
      ) => new BulkCreateSubjectsUseCase(logger, createSubjectUseCase),
      inject: [LoggerService, CreateSubjectUseCase],
    },
    {
      provide: SubjectFacade,
      useFactory: (
        createSubjectUseCase: CreateSubjectUseCase,
        getSubjectsByClassUseCase: GetSubjectsByClassUseCase,
        updateSubjectUseCase: UpdateSubjectUseCase,
        deleteSubjectUseCase: DeleteSubjectUseCase,
        bulkCreateSubjectsUseCase: BulkCreateSubjectsUseCase
      ) =>
        new SubjectFacade(
          createSubjectUseCase,
          getSubjectsByClassUseCase,
          updateSubjectUseCase,
          deleteSubjectUseCase,
          bulkCreateSubjectsUseCase
        ),
      inject: [
        CreateSubjectUseCase,
        GetSubjectsByClassUseCase,
        UpdateSubjectUseCase,
        DeleteSubjectUseCase,
        BulkCreateSubjectsUseCase,
      ],
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
  constructor() {}
}
