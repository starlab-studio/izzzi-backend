import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  ILoggerService,
  LoggerService,
  TypeOrmUnitOfWork,
  IUnitOfWork,
  EventStore,
  IEventStore,
} from "src/core";
import { CoreModule } from "src/core/core.module";
import { OrganizationModule } from "../organization/organization.module";
import { SubjectModule } from "../subject/subject.module";
import { QuizModule } from "../quiz/quiz.module";
import { SubscriptionModule } from "../subscription/subscription.module";
import { ClassModule } from "../class/class.module";
import { AiModule } from "../ai/ai.module";

import { GetFeedbackSubjectsUseCase } from "./application/use-cases/GetFeedbackSubjects.use-case";
import { GetFeedbackBySubjectUseCase } from "./application/use-cases/GetFeedbackBySubject.use-case";
import { GetFeedbackSummaryUseCase } from "./application/use-cases/GetFeedbackSummary.use-case";
import { GetSubjectAlertsUseCase } from "./application/use-cases/GetSubjectAlerts.use-case";
import { CommentOnAlertUseCase } from "./application/use-cases/CommentOnAlert.use-case";
import { GetAlertCommentsUseCase } from "./application/use-cases/GetAlertComments.use-case";
import { SendMessageForAlertUseCase } from "./application/use-cases/SendMessageForAlert.use-case";
import { MarkAlertAsProcessedUseCase } from "./application/use-cases/MarkAlertAsProcessed.use-case";
import { GetFeedbackSubjectByIdUseCase } from "./application/use-cases/GetFeedbackSubjectById.use-case";
import { SendReminderBySubjectUseCase } from "./application/use-cases/SendReminderBySubject.use-case";
import { CreateAlertUseCase } from "./application/use-cases/CreateAlert.use-case";
import { GenerateAndSaveSubjectSummaryUseCase } from "./application/use-cases/GenerateAndSaveSubjectSummary.use-case";
import { FeedbackFacade } from "./application/facades/feedback.facade";
import { FeedbackController } from "./interface/controllers/feedback.controller";
import { AiClientService } from "../ai/application/services/ai-client.service";

import { ISubjectRepository } from "../subject/domain/repositories/subject.repository";
import { SubjectRepository } from "../subject/infrastructure/repositories/subject.repository";
import { ISubjectAssignmentRepository } from "../subject/domain/repositories/subject-assignment.repository";
import { SubjectAssignmentRepository } from "../subject/infrastructure/repositories/subject-assignment.repository";
import { IQuizRepository } from "../quiz/domain/repositories/quiz.repository";
import { IResponseRepository } from "../quiz/domain/repositories/response.repository";
import { IAnswerRepository } from "../quiz/domain/repositories/answer.repository";
import { IQuizTemplateRepository } from "../quiz/domain/repositories/quiz-template.repository";
import { OrganizationFacade } from "../organization/application/facades/organization.facade";
import { IClassRepository } from "../class/domain/repositories/class.repository";
import { ClassRepository } from "../class/infrastructure/repositories/class.repository";
import { ResponseVisibilityService } from "../quiz/domain/services/response-visibility.service";
import { SubscriptionFeatureService } from "../subscription/domain/services/subscription-feature.service";
import { ISubscriptionRepository } from "../subscription/domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "../subscription/domain/repositories/subscription-plan.repository";
import { SUBSCRIPTION_REPOSITORY } from "../subscription/domain/repositories/subscription.repository";
import { SUBSCRIPTION_PLAN_REPOSITORY } from "../subscription/domain/repositories/subscription-plan.repository";
import { QuizFacade } from "../quiz/application/facades/quiz.facade";
import { FeedbackAlertModel } from "./infrastructure/models/feedback-alert.model";
import { AlertCommentModel } from "./infrastructure/models/alert-comment.model";
import { SubjectSummaryModel } from "./infrastructure/models/subject-summary.model";
import { FeedbackAlertRepository } from "./infrastructure/repositories/feedback-alert.repository";
import { AlertCommentRepository } from "./infrastructure/repositories/alert-comment.repository";
import { SubjectSummaryRepository } from "./infrastructure/repositories/subject-summary.repository";
import { IFeedbackAlertRepository } from "./domain/repositories/feedback-alert.repository";
import { IAlertCommentRepository } from "./domain/repositories/alert-comment.repository";
import { ISubjectSummaryRepository } from "./domain/repositories/subject-summary.repository";

@Module({
  imports: [
    CoreModule,
    OrganizationModule,
    forwardRef(() => SubjectModule),
    forwardRef(() => QuizModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => ClassModule),
    AiModule,
    TypeOrmModule.forFeature([
      FeedbackAlertModel,
      AlertCommentModel,
      SubjectSummaryModel,
    ]),
  ],
  controllers: [FeedbackController],
  providers: [
    LoggerService,
    {
      provide: FeedbackAlertRepository,
      useFactory: (
        directRepository: Repository<FeedbackAlertModel>,
        unitOfWork: IUnitOfWork,
      ) => {
        return new FeedbackAlertRepository(directRepository, unitOfWork);
      },
      inject: [getRepositoryToken(FeedbackAlertModel), TypeOrmUnitOfWork],
    },
    {
      provide: "FEEDBACK_ALERT_REPOSITORY",
      useExisting: FeedbackAlertRepository,
    },
    {
      provide: AlertCommentRepository,
      useFactory: (
        directRepository: Repository<AlertCommentModel>,
        unitOfWork: IUnitOfWork,
      ) => {
        return new AlertCommentRepository(directRepository, unitOfWork);
      },
      inject: [getRepositoryToken(AlertCommentModel), TypeOrmUnitOfWork],
    },
    {
      provide: "ALERT_COMMENT_REPOSITORY",
      useExisting: AlertCommentRepository,
    },
    {
      provide: SubjectSummaryRepository,
      useFactory: (
        directRepository: Repository<SubjectSummaryModel>,
        unitOfWork: IUnitOfWork,
      ) => {
        return new SubjectSummaryRepository(directRepository, unitOfWork);
      },
      inject: [getRepositoryToken(SubjectSummaryModel), TypeOrmUnitOfWork],
    },
    {
      provide: "SUBJECT_SUMMARY_REPOSITORY",
      useExisting: SubjectSummaryRepository,
    },
    {
      provide: GetFeedbackSubjectsUseCase,
      useFactory: (
        logger: ILoggerService,
        subjectRepository: ISubjectRepository,
        subjectAssignmentRepository: ISubjectAssignmentRepository,
        quizRepository: IQuizRepository,
        responseRepository: IResponseRepository,
        answerRepository: IAnswerRepository,
        quizTemplateRepository: IQuizTemplateRepository,
        organizationFacade: OrganizationFacade,
        classRepository: IClassRepository,
        responseVisibilityService: ResponseVisibilityService,
        subscriptionFeatureService: SubscriptionFeatureService,
        subscriptionRepository: ISubscriptionRepository,
        subscriptionPlanRepository: ISubscriptionPlanRepository,
        subjectSummaryRepository: ISubjectSummaryRepository,
        feedbackAlertRepository: IFeedbackAlertRepository,
      ) =>
        new GetFeedbackSubjectsUseCase(
          logger,
          subjectRepository,
          subjectAssignmentRepository,
          quizRepository,
          responseRepository,
          answerRepository,
          quizTemplateRepository,
          organizationFacade,
          classRepository,
          responseVisibilityService,
          subscriptionFeatureService,
          subscriptionRepository,
          subscriptionPlanRepository,
          subjectSummaryRepository,
          feedbackAlertRepository,
        ),
      inject: [
        LoggerService,
        SubjectRepository,
        SubjectAssignmentRepository,
        "QUIZ_REPOSITORY",
        "RESPONSE_REPOSITORY",
        "ANSWER_REPOSITORY",
        "QUIZ_TEMPLATE_REPOSITORY",
        OrganizationFacade,
        ClassRepository,
        ResponseVisibilityService,
        SubscriptionFeatureService,
        SUBSCRIPTION_REPOSITORY,
        SUBSCRIPTION_PLAN_REPOSITORY,
        "SUBJECT_SUMMARY_REPOSITORY",
        "FEEDBACK_ALERT_REPOSITORY",
      ],
    },
    {
      provide: GetFeedbackBySubjectUseCase,
      useFactory: (
        logger: ILoggerService,
        subjectRepository: ISubjectRepository,
        quizRepository: IQuizRepository,
        responseRepository: IResponseRepository,
        answerRepository: IAnswerRepository,
        quizTemplateRepository: IQuizTemplateRepository,
        organizationFacade: OrganizationFacade,
        responseVisibilityService: ResponseVisibilityService,
        subscriptionFeatureService: SubscriptionFeatureService,
        subscriptionRepository: ISubscriptionRepository,
        subscriptionPlanRepository: ISubscriptionPlanRepository,
      ) =>
        new GetFeedbackBySubjectUseCase(
          logger,
          subjectRepository,
          quizRepository,
          responseRepository,
          answerRepository,
          quizTemplateRepository,
          organizationFacade,
          responseVisibilityService,
          subscriptionFeatureService,
          subscriptionRepository,
          subscriptionPlanRepository,
        ),
      inject: [
        LoggerService,
        SubjectRepository,
        "QUIZ_REPOSITORY",
        "RESPONSE_REPOSITORY",
        "ANSWER_REPOSITORY",
        "QUIZ_TEMPLATE_REPOSITORY",
        OrganizationFacade,
        ResponseVisibilityService,
        SubscriptionFeatureService,
        SUBSCRIPTION_REPOSITORY,
        SUBSCRIPTION_PLAN_REPOSITORY,
      ],
    },
    {
      provide: GetFeedbackSummaryUseCase,
      useFactory: (
        logger: ILoggerService,
        subjectSummaryRepository: ISubjectSummaryRepository,
      ) => new GetFeedbackSummaryUseCase(logger, subjectSummaryRepository),
      inject: [LoggerService, "SUBJECT_SUMMARY_REPOSITORY"],
    },
    {
      provide: GetSubjectAlertsUseCase,
      useFactory: (
        logger: ILoggerService,
        feedbackAlertRepository: IFeedbackAlertRepository,
      ) => new GetSubjectAlertsUseCase(logger, feedbackAlertRepository),
      inject: [LoggerService, "FEEDBACK_ALERT_REPOSITORY"],
    },
    {
      provide: CommentOnAlertUseCase,
      useFactory: (
        logger: ILoggerService,
        alertCommentRepository: IAlertCommentRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new CommentOnAlertUseCase(
          logger,
          alertCommentRepository,
          organizationFacade,
        ),
      inject: [LoggerService, "ALERT_COMMENT_REPOSITORY", OrganizationFacade],
    },
    {
      provide: GetAlertCommentsUseCase,
      useFactory: (
        logger: ILoggerService,
        alertCommentRepository: IAlertCommentRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new GetAlertCommentsUseCase(
          logger,
          alertCommentRepository,
          organizationFacade,
        ),
      inject: [LoggerService, "ALERT_COMMENT_REPOSITORY", OrganizationFacade],
    },
    {
      provide: SendMessageForAlertUseCase,
      useFactory: (logger: ILoggerService) =>
        new SendMessageForAlertUseCase(logger),
      inject: [LoggerService],
    },
    {
      provide: MarkAlertAsProcessedUseCase,
      useFactory: (
        logger: ILoggerService,
        feedbackAlertRepository: IFeedbackAlertRepository,
        organizationFacade: OrganizationFacade,
      ) =>
        new MarkAlertAsProcessedUseCase(
          logger,
          feedbackAlertRepository,
          organizationFacade,
        ),
      inject: [LoggerService, "FEEDBACK_ALERT_REPOSITORY", OrganizationFacade],
    },
    {
      provide: GetFeedbackSubjectByIdUseCase,
      useFactory: (
        logger: ILoggerService,
        getFeedbackSubjectsUseCase: GetFeedbackSubjectsUseCase,
      ) => {
        return new GetFeedbackSubjectByIdUseCase(
          logger,
          getFeedbackSubjectsUseCase,
        );
      },
      inject: [LoggerService, GetFeedbackSubjectsUseCase],
    },
    {
      provide: SendReminderBySubjectUseCase,
      useFactory: (logger: ILoggerService, quizFacade: QuizFacade) => {
        return new SendReminderBySubjectUseCase(logger, quizFacade);
      },
      inject: [LoggerService, QuizFacade],
    },
    {
      provide: CreateAlertUseCase,
      useFactory: (
        logger: ILoggerService,
        eventStore: IEventStore,
        feedbackAlertRepository: IFeedbackAlertRepository,
        quizRepository: IQuizRepository,
      ) =>
        new CreateAlertUseCase(
          logger,
          eventStore,
          feedbackAlertRepository,
          quizRepository,
        ),
      inject: [
        LoggerService,
        EventStore,
        "FEEDBACK_ALERT_REPOSITORY",
        "QUIZ_REPOSITORY",
      ],
    },
    {
      provide: GenerateAndSaveSubjectSummaryUseCase,
      useFactory: (
        logger: ILoggerService,
        aiClientService: AiClientService,
        subjectSummaryRepository: ISubjectSummaryRepository,
        quizRepository: IQuizRepository,
        responseRepository: IResponseRepository,
      ) =>
        new GenerateAndSaveSubjectSummaryUseCase(
          logger,
          aiClientService,
          subjectSummaryRepository,
          quizRepository,
          responseRepository,
        ),
      inject: [
        LoggerService,
        AiClientService,
        "SUBJECT_SUMMARY_REPOSITORY",
        "QUIZ_REPOSITORY",
        "RESPONSE_REPOSITORY",
      ],
    },
    {
      provide: FeedbackFacade,
      useFactory: (
        getFeedbackSubjectsUseCase: GetFeedbackSubjectsUseCase,
        getFeedbackBySubjectUseCase: GetFeedbackBySubjectUseCase,
        getFeedbackSummaryUseCase: GetFeedbackSummaryUseCase,
        getSubjectAlertsUseCase: GetSubjectAlertsUseCase,
        commentOnAlertUseCase: CommentOnAlertUseCase,
        getAlertCommentsUseCase: GetAlertCommentsUseCase,
        sendMessageForAlertUseCase: SendMessageForAlertUseCase,
        markAlertAsProcessedUseCase: MarkAlertAsProcessedUseCase,
        getFeedbackSubjectByIdUseCase: GetFeedbackSubjectByIdUseCase,
        sendReminderBySubjectUseCase: SendReminderBySubjectUseCase,
        createAlertUseCase: CreateAlertUseCase,
        generateAndSaveSubjectSummaryUseCase: GenerateAndSaveSubjectSummaryUseCase,
      ) =>
        new FeedbackFacade(
          getFeedbackSubjectsUseCase,
          getFeedbackBySubjectUseCase,
          getFeedbackSummaryUseCase,
          getSubjectAlertsUseCase,
          commentOnAlertUseCase,
          getAlertCommentsUseCase,
          sendMessageForAlertUseCase,
          markAlertAsProcessedUseCase,
          getFeedbackSubjectByIdUseCase,
          sendReminderBySubjectUseCase,
          createAlertUseCase,
          generateAndSaveSubjectSummaryUseCase,
        ),
      inject: [
        GetFeedbackSubjectsUseCase,
        GetFeedbackBySubjectUseCase,
        GetFeedbackSummaryUseCase,
        GetSubjectAlertsUseCase,
        CommentOnAlertUseCase,
        GetAlertCommentsUseCase,
        SendMessageForAlertUseCase,
        MarkAlertAsProcessedUseCase,
        GetFeedbackSubjectByIdUseCase,
        SendReminderBySubjectUseCase,
        CreateAlertUseCase,
        GenerateAndSaveSubjectSummaryUseCase,
      ],
    },
  ],
  exports: [FeedbackFacade],
})
export class FeedbackModule {}
