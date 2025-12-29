import { Module, forwardRef } from "@nestjs/common";

import { ILoggerService, LoggerService } from "src/core";
import { CoreModule } from "src/core/core.module";
import { OrganizationModule } from "../organization/organization.module";
import { SubjectModule } from "../subject/subject.module";
import { QuizModule } from "../quiz/quiz.module";
import { SubscriptionModule } from "../subscription/subscription.module";
import { ClassModule } from "../class/class.module";

import { GetFeedbackSubjectsUseCase } from "./application/use-cases/GetFeedbackSubjects.use-case";
import { GetFeedbackBySubjectUseCase } from "./application/use-cases/GetFeedbackBySubject.use-case";
import { FeedbackFacade } from "./application/facades/feedback.facade";
import { FeedbackController } from "./interface/controllers/feedback.controller";

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

@Module({
  imports: [
    CoreModule,
    OrganizationModule,
    forwardRef(() => SubjectModule),
    forwardRef(() => QuizModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => ClassModule),
  ],
  controllers: [FeedbackController],
  providers: [
    LoggerService,
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
        subscriptionPlanRepository: ISubscriptionPlanRepository
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
          subscriptionPlanRepository
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
        subscriptionPlanRepository: ISubscriptionPlanRepository
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
          subscriptionPlanRepository
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
      provide: FeedbackFacade,
      useFactory: (
        getFeedbackSubjectsUseCase: GetFeedbackSubjectsUseCase,
        getFeedbackBySubjectUseCase: GetFeedbackBySubjectUseCase
      ) =>
        new FeedbackFacade(
          getFeedbackSubjectsUseCase,
          getFeedbackBySubjectUseCase
        ),
      inject: [GetFeedbackSubjectsUseCase, GetFeedbackBySubjectUseCase],
    },
  ],
  exports: [FeedbackFacade],
})
export class FeedbackModule {}
