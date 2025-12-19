import { Module } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  ILoggerService,
  LoggerService,
  TypeOrmUnitOfWork,
  IUnitOfWork,
} from "src/core";
import { CoreModule } from "src/core/core.module";
import { OrganizationModule } from "src/modules/organization/organization.module";
import { SubjectModule } from "../subject/subject.module";
import { ClassModule } from "../class/class.module";

import { QuizTemplateModel } from "./infrastructure/models/quiz-template.model";
import { QuizTemplateQuestionModel } from "./infrastructure/models/quiz-template-question.model";
import { QuizTemplatePairModel } from "./infrastructure/models/quiz-template-pair.model";
import { QuizModel } from "./infrastructure/models/quiz.model";
import { ResponseModel } from "./infrastructure/models/response.model";
import { AnswerModel } from "./infrastructure/models/answer.model";
import { StudentQuizTokenModel } from "./infrastructure/models/student-quiz-token.model";

import { QuizTemplatePairRepository } from "./infrastructure/repositories/quiz-template-pair.repository";
import { QuizTemplateRepository } from "./infrastructure/repositories/quiz-template.repository";
import { QuizRepository } from "./infrastructure/repositories/quiz.repository";
import { ResponseRepository } from "./infrastructure/repositories/response.repository";
import { AnswerRepository } from "./infrastructure/repositories/answer.repository";
import { StudentQuizTokenRepository } from "./infrastructure/repositories/student-quiz-token.repository";

import { IQuizTemplatePairRepository } from "./domain/repositories/quiz-template-pair.repository";
import { IQuizTemplateRepository } from "./domain/repositories/quiz-template.repository";
import { IQuizRepository } from "./domain/repositories/quiz.repository";
import { IResponseRepository } from "./domain/repositories/response.repository";
import { IAnswerRepository } from "./domain/repositories/answer.repository";
import { IStudentQuizTokenRepository } from "./domain/repositories/student-quiz-token.repository";

import { GetQuizTemplatePairsUseCase } from "./application/use-cases/GetQuizTemplatePairs.use-case";
import { GetQuizTemplateByIdUseCase } from "./application/use-cases/GetQuizTemplateById.use-case";
import { CreateQuizTemplateUseCase } from "./application/use-cases/CreateQuizTemplate.use-case";
import { AssignQuizPairToSubjectUseCase } from "./application/use-cases/AssignQuizPairToSubject.use-case";
import { ReassignQuizPairToSubjectUseCase } from "./application/use-cases/ReassignQuizPairToSubject.use-case";
import { GetQuizzesBySubjectUseCase } from "./application/use-cases/GetQuizzesBySubject.use-case";
import { GetQuizByIdUseCase } from "./application/use-cases/GetQuizById.use-case";
import { GetQuizLinkUseCase } from "./application/use-cases/GetQuizLink.use-case";
import { SendQuizToStudentsUseCase } from "./application/use-cases/SendQuizToStudents.use-case";
import { RemindQuizToStudentsUseCase } from "./application/use-cases/RemindQuizToStudents.use-case";
import { GetQuizByAccessTokenUseCase } from "./application/use-cases/GetQuizByAccessToken.use-case";
import { SubmitQuizResponseUseCase } from "./application/use-cases/SubmitQuizResponse.use-case";
import { CheckQuizResponseStatusUseCase } from "./application/use-cases/CheckQuizResponseStatus.use-case";

import { QuizFacade } from "./application/facades/quiz.facade";

import { QuizTemplateController } from "./interface/controllers/quiz-template.controller";
import { QuizController, QuizDetailController } from "./interface/controllers/quiz.controller";
import { QuizPublicController, QuizPublicSubmitController } from "./interface/controllers/quiz-public.controller";

import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { ISubjectRepository } from "../subject/domain/repositories/subject.repository";
import { SubjectRepository } from "../subject/infrastructure/repositories/subject.repository";
import { IClassRepository } from "../class/domain/repositories/class.repository";
import { ClassRepository } from "../class/infrastructure/repositories/class.repository";
import { IClassStudentRepository } from "../class/domain/repositories/class-student.repository";
import { ClassStudentRepository } from "../class/infrastructure/repositories/class-student.repository";
import { ISubjectAssignmentRepository } from "../subject/domain/repositories/subject-assignment.repository";
import { SubjectAssignmentRepository } from "../subject/infrastructure/repositories/subject-assignment.repository";
import { IOrganizationRepository } from "../organization/domain/repositories/organization.repository";
import { OrganizationRepository } from "../organization/infrastructure/repositories/organization.repository";
import { OrganizationModel } from "../organization/infrastructure/models/organization.model";
import { NotificationModule } from "../notification/notification.module";
import { CreateEmailNotificationUseCase } from "../notification/application/use-cases/create-email-notification.use-case";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuizTemplateModel,
      QuizTemplateQuestionModel,
      QuizTemplatePairModel,
      QuizModel,
      ResponseModel,
      AnswerModel,
      StudentQuizTokenModel,
      OrganizationModel,
    ]),
    CoreModule,
    OrganizationModule,
    SubjectModule,
    ClassModule,
    NotificationModule,
  ],
  providers: [
    LoggerService,
    {
      provide: OrganizationRepository,
      useFactory: (
        ormRepository: Repository<OrganizationModel>,
        unitOfWork: IUnitOfWork,
      ) => new OrganizationRepository(ormRepository, unitOfWork),
      inject: [getRepositoryToken(OrganizationModel), TypeOrmUnitOfWork],
    },
    {
      provide: QuizTemplatePairRepository,
      useFactory: (
        directRepository: Repository<QuizTemplatePairModel>,
        unitOfWork: IUnitOfWork,
      ) => new QuizTemplatePairRepository(directRepository, unitOfWork),
      inject: [getRepositoryToken(QuizTemplatePairModel), TypeOrmUnitOfWork],
    },
    {
      provide: "QUIZ_TEMPLATE_PAIR_REPOSITORY",
      useExisting: QuizTemplatePairRepository,
    },
    {
      provide: QuizTemplateRepository,
      useFactory: (
        directRepository: Repository<QuizTemplateModel>,
        questionRepository: Repository<QuizTemplateQuestionModel>,
        unitOfWork: IUnitOfWork,
      ) => new QuizTemplateRepository(directRepository, questionRepository, unitOfWork),
      inject: [
        getRepositoryToken(QuizTemplateModel),
        getRepositoryToken(QuizTemplateQuestionModel),
        TypeOrmUnitOfWork,
      ],
    },
    {
      provide: "QUIZ_TEMPLATE_REPOSITORY",
      useExisting: QuizTemplateRepository,
    },
    {
      provide: QuizRepository,
      useFactory: (
        directRepository: Repository<QuizModel>,
        unitOfWork: IUnitOfWork,
      ) => new QuizRepository(directRepository, unitOfWork),
      inject: [getRepositoryToken(QuizModel), TypeOrmUnitOfWork],
    },
    {
      provide: "QUIZ_REPOSITORY",
      useExisting: QuizRepository,
    },
    {
      provide: ResponseRepository,
      useFactory: (
        directRepository: Repository<ResponseModel>,
        unitOfWork: IUnitOfWork,
      ) => new ResponseRepository(directRepository, unitOfWork),
      inject: [getRepositoryToken(ResponseModel), TypeOrmUnitOfWork],
    },
    {
      provide: "RESPONSE_REPOSITORY",
      useExisting: ResponseRepository,
    },
    {
      provide: AnswerRepository,
      useFactory: (
        directRepository: Repository<AnswerModel>,
        unitOfWork: IUnitOfWork,
      ) => new AnswerRepository(directRepository, unitOfWork),
      inject: [getRepositoryToken(AnswerModel), TypeOrmUnitOfWork],
    },
    {
      provide: "ANSWER_REPOSITORY",
      useExisting: AnswerRepository,
    },
    {
      provide: StudentQuizTokenRepository,
      useFactory: (
        directRepository: Repository<StudentQuizTokenModel>,
        unitOfWork: IUnitOfWork,
      ) => new StudentQuizTokenRepository(directRepository, unitOfWork),
      inject: [getRepositoryToken(StudentQuizTokenModel), TypeOrmUnitOfWork],
    },
    {
      provide: "STUDENT_QUIZ_TOKEN_REPOSITORY",
      useExisting: StudentQuizTokenRepository,
    },
    {
      provide: GetQuizTemplatePairsUseCase,
      useFactory: (
        logger: ILoggerService,
        quizTemplatePairRepository: IQuizTemplatePairRepository,
        quizTemplateRepository: IQuizTemplateRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new GetQuizTemplatePairsUseCase(
          logger,
          quizTemplatePairRepository,
          quizTemplateRepository,
          organizationFacade,
        ),
      inject: [
        LoggerService,
        "QUIZ_TEMPLATE_PAIR_REPOSITORY",
        "QUIZ_TEMPLATE_REPOSITORY",
        OrganizationFacade,
      ],
    },
    {
      provide: GetQuizTemplateByIdUseCase,
      useFactory: (
        logger: ILoggerService,
        quizTemplateRepository: IQuizTemplateRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new GetQuizTemplateByIdUseCase(
          logger,
          quizTemplateRepository,
          organizationFacade,
        ),
      inject: [
        LoggerService,
        "QUIZ_TEMPLATE_REPOSITORY",
        OrganizationFacade,
      ],
    },
    {
      provide: CreateQuizTemplateUseCase,
      useFactory: (
        logger: ILoggerService,
        quizTemplateRepository: IQuizTemplateRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new CreateQuizTemplateUseCase(
          logger,
          quizTemplateRepository,
          organizationFacade,
        ),
      inject: [
        LoggerService,
        "QUIZ_TEMPLATE_REPOSITORY",
        OrganizationFacade,
      ],
    },
    {
      provide: AssignQuizPairToSubjectUseCase,
      useFactory: (
        logger: ILoggerService,
        quizTemplatePairRepository: IQuizTemplatePairRepository,
        quizRepository: IQuizRepository,
        subjectRepository: ISubjectRepository,
        subjectAssignmentRepository: ISubjectAssignmentRepository,
        classRepository: IClassRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new AssignQuizPairToSubjectUseCase(
          logger,
          quizTemplatePairRepository,
          quizRepository,
          subjectRepository,
          subjectAssignmentRepository,
          classRepository,
          organizationFacade,
        ),
      inject: [
        LoggerService,
        "QUIZ_TEMPLATE_PAIR_REPOSITORY",
        "QUIZ_REPOSITORY",
        SubjectRepository,
        SubjectAssignmentRepository,
        ClassRepository,
        OrganizationFacade,
      ],
    },
    {
      provide: ReassignQuizPairToSubjectUseCase,
      useFactory: (
        logger: ILoggerService,
        quizTemplatePairRepository: IQuizTemplatePairRepository,
        quizRepository: IQuizRepository,
        responseRepository: IResponseRepository,
        subjectRepository: ISubjectRepository,
        subjectAssignmentRepository: ISubjectAssignmentRepository,
        classRepository: IClassRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new ReassignQuizPairToSubjectUseCase(
          logger,
          quizTemplatePairRepository,
          quizRepository,
          responseRepository,
          subjectRepository,
          subjectAssignmentRepository,
          classRepository,
          organizationFacade,
        ),
      inject: [
        LoggerService,
        "QUIZ_TEMPLATE_PAIR_REPOSITORY",
        "QUIZ_REPOSITORY",
        "RESPONSE_REPOSITORY",
        SubjectRepository,
        SubjectAssignmentRepository,
        ClassRepository,
        OrganizationFacade,
      ],
    },
    {
      provide: GetQuizzesBySubjectUseCase,
      useFactory: (
        logger: ILoggerService,
        quizRepository: IQuizRepository,
        subjectRepository: ISubjectRepository,
        quizTemplateRepository: IQuizTemplateRepository,
        organizationFacade: OrganizationFacade,
        studentQuizTokenRepository: IStudentQuizTokenRepository,
      ) =>
        new GetQuizzesBySubjectUseCase(
          logger,
          quizRepository,
          subjectRepository,
          quizTemplateRepository,
          organizationFacade,
          studentQuizTokenRepository,
        ),
      inject: [
        LoggerService,
        "QUIZ_REPOSITORY",
        SubjectRepository,
        "QUIZ_TEMPLATE_REPOSITORY",
        OrganizationFacade,
        "STUDENT_QUIZ_TOKEN_REPOSITORY",
      ],
    },
    {
      provide: GetQuizByIdUseCase,
      useFactory: (
        logger: ILoggerService,
        quizRepository: IQuizRepository,
        quizTemplateRepository: IQuizTemplateRepository,
        subjectRepository: ISubjectRepository,
        subjectAssignmentRepository: ISubjectAssignmentRepository,
        classRepository: IClassRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new GetQuizByIdUseCase(
          logger,
          quizRepository,
          quizTemplateRepository,
          subjectRepository,
          subjectAssignmentRepository,
          classRepository,
          organizationFacade,
        ),
      inject: [
        LoggerService,
        "QUIZ_REPOSITORY",
        "QUIZ_TEMPLATE_REPOSITORY",
        SubjectRepository,
        SubjectAssignmentRepository,
        ClassRepository,
        OrganizationFacade,
      ],
    },
    {
      provide: GetQuizLinkUseCase,
      useFactory: (
        logger: ILoggerService,
        quizRepository: IQuizRepository,
        subjectRepository: ISubjectRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new GetQuizLinkUseCase(
          logger,
          quizRepository,
          subjectRepository,
          organizationFacade,
        ),
      inject: [
        LoggerService,
        "QUIZ_REPOSITORY",
        SubjectRepository,
        OrganizationFacade,
      ],
    },
    {
      provide: GetQuizByAccessTokenUseCase,
      useFactory: (
        logger: ILoggerService,
        quizRepository: IQuizRepository,
        quizTemplateRepository: IQuizTemplateRepository,
        subjectRepository: ISubjectRepository,
        subjectAssignmentRepository: ISubjectAssignmentRepository,
        classRepository: IClassRepository,
        organizationRepository: IOrganizationRepository,
      ) =>
        new GetQuizByAccessTokenUseCase(
          logger,
          quizRepository,
          quizTemplateRepository,
          subjectRepository,
          subjectAssignmentRepository,
          classRepository,
          organizationRepository,
        ),
      inject: [
        LoggerService,
        "QUIZ_REPOSITORY",
        "QUIZ_TEMPLATE_REPOSITORY",
        SubjectRepository,
        SubjectAssignmentRepository,
        ClassRepository,
        OrganizationRepository,
      ],
    },
    {
      provide: SendQuizToStudentsUseCase,
      useFactory: (
        logger: ILoggerService,
        quizRepository: IQuizRepository,
        studentQuizTokenRepository: IStudentQuizTokenRepository,
        subjectRepository: ISubjectRepository,
        subjectAssignmentRepository: ISubjectAssignmentRepository,
        classStudentRepository: IClassStudentRepository,
        organizationFacade: OrganizationFacade,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase,
      ) =>
        new SendQuizToStudentsUseCase(
          logger,
          quizRepository,
          studentQuizTokenRepository,
          subjectRepository,
          subjectAssignmentRepository,
          classStudentRepository,
          organizationFacade,
          createEmailNotificationUseCase,
        ),
      inject: [
        LoggerService,
        "QUIZ_REPOSITORY",
        "STUDENT_QUIZ_TOKEN_REPOSITORY",
        SubjectRepository,
        SubjectAssignmentRepository,
        ClassStudentRepository,
        OrganizationFacade,
        CreateEmailNotificationUseCase,
      ],
    },
    {
      provide: RemindQuizToStudentsUseCase,
      useFactory: (
        logger: ILoggerService,
        quizRepository: IQuizRepository,
        studentQuizTokenRepository: IStudentQuizTokenRepository,
        subjectRepository: ISubjectRepository,
        subjectAssignmentRepository: ISubjectAssignmentRepository,
        classStudentRepository: IClassStudentRepository,
        organizationFacade: OrganizationFacade,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase,
      ) =>
        new RemindQuizToStudentsUseCase(
          logger,
          quizRepository,
          studentQuizTokenRepository,
          subjectRepository,
          subjectAssignmentRepository,
          classStudentRepository,
          organizationFacade,
          createEmailNotificationUseCase,
        ),
      inject: [
        LoggerService,
        "QUIZ_REPOSITORY",
        "STUDENT_QUIZ_TOKEN_REPOSITORY",
        SubjectRepository,
        SubjectAssignmentRepository,
        ClassStudentRepository,
        OrganizationFacade,
        CreateEmailNotificationUseCase,
      ],
    },
    {
      provide: SubmitQuizResponseUseCase,
      useFactory: (
        logger: ILoggerService,
        quizRepository: IQuizRepository,
        quizTemplateRepository: IQuizTemplateRepository,
        responseRepository: IResponseRepository,
        answerRepository: IAnswerRepository,
      ) =>
        new SubmitQuizResponseUseCase(
          logger,
          quizRepository,
          quizTemplateRepository,
          responseRepository,
          answerRepository,
        ),
      inject: [
        LoggerService,
        "QUIZ_REPOSITORY",
        "QUIZ_TEMPLATE_REPOSITORY",
        "RESPONSE_REPOSITORY",
        "ANSWER_REPOSITORY",
      ],
    },
    {
      provide: CheckQuizResponseStatusUseCase,
      useFactory: (
        logger: ILoggerService,
        quizRepository: IQuizRepository,
        responseRepository: IResponseRepository,
      ) =>
        new CheckQuizResponseStatusUseCase(
          logger,
          quizRepository,
          responseRepository,
        ),
      inject: [
        LoggerService,
        "QUIZ_REPOSITORY",
        "RESPONSE_REPOSITORY",
      ],
    },
    {
      provide: QuizFacade,
      useFactory: (
        getQuizTemplatePairsUseCase: GetQuizTemplatePairsUseCase,
        getQuizTemplateByIdUseCase: GetQuizTemplateByIdUseCase,
        createQuizTemplateUseCase: CreateQuizTemplateUseCase,
        assignQuizPairToSubjectUseCase: AssignQuizPairToSubjectUseCase,
        reassignQuizPairToSubjectUseCase: ReassignQuizPairToSubjectUseCase,
        getQuizzesBySubjectUseCase: GetQuizzesBySubjectUseCase,
        getQuizByIdUseCase: GetQuizByIdUseCase,
        getQuizLinkUseCase: GetQuizLinkUseCase,
        sendQuizToStudentsUseCase: SendQuizToStudentsUseCase,
        remindQuizToStudentsUseCase: RemindQuizToStudentsUseCase,
        getQuizByAccessTokenUseCase: GetQuizByAccessTokenUseCase,
        submitQuizResponseUseCase: SubmitQuizResponseUseCase,
        checkQuizResponseStatusUseCase: CheckQuizResponseStatusUseCase,
      ) =>
        new QuizFacade(
          getQuizTemplatePairsUseCase,
          getQuizTemplateByIdUseCase,
          createQuizTemplateUseCase,
          assignQuizPairToSubjectUseCase,
          reassignQuizPairToSubjectUseCase,
          getQuizzesBySubjectUseCase,
          getQuizByIdUseCase,
          getQuizLinkUseCase,
          sendQuizToStudentsUseCase,
          remindQuizToStudentsUseCase,
          getQuizByAccessTokenUseCase,
          submitQuizResponseUseCase,
          checkQuizResponseStatusUseCase,
        ),
      inject: [
        GetQuizTemplatePairsUseCase,
        GetQuizTemplateByIdUseCase,
        CreateQuizTemplateUseCase,
        AssignQuizPairToSubjectUseCase,
        ReassignQuizPairToSubjectUseCase,
        GetQuizzesBySubjectUseCase,
        GetQuizByIdUseCase,
        GetQuizLinkUseCase,
        SendQuizToStudentsUseCase,
        RemindQuizToStudentsUseCase,
        GetQuizByAccessTokenUseCase,
        SubmitQuizResponseUseCase,
        CheckQuizResponseStatusUseCase,
      ],
    },
  ],
  controllers: [QuizTemplateController, QuizController, QuizDetailController, QuizPublicController, QuizPublicSubmitController],
  exports: [QuizFacade],
})
export class QuizModule {}

