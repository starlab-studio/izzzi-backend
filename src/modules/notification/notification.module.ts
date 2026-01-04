import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { CoreModule } from "src/core/core.module";
import { EventHandlerRegistry, ILoggerService, LoggerService } from "src/core";
import { UserCreatedEventHandler } from "./application/handlers/user-created.handler";
import { ClassCreatedEventHandler } from "./application/handlers/class-created.handler";
import { CreateEmailNotificationUseCase } from "./application/use-cases/create-email-notification.use-case";
import { NotificationDomainService } from "./domain/services/notification.service";
import { INotificationRespository } from "./domain/repositories/notification.repository";
import { NotificationProviderFactory } from "./infrastructure/factories/notification.factory";
import { NotificationMode } from "./domain/notification.types";
import { EmailProvider } from "./infrastructure/providers/email.provider";
import { NotificationRepository } from "./infrastructure/repositories/notification.repository";
import { INotificationProvider } from "./application/providers/notification.provider";
import { NotificationModel } from "./infrastructure/models/notification.model";
import { InvitationSentEventHandler } from "./application/handlers/invitation-sent.handler";
import { InvitationAcceptedEventHandler } from "./application/handlers/invitation-accepted.handler";
import { ClassArchivedEventHandler } from "./application/handlers/class-archived.handler";
import { SubscriptionActivatedEventHandler } from "./application/handlers/subscription-activated.handler";
import { SubscriptionModule } from "../subscription/subscription.module";
import { SendSubscriptionConfirmationEmailUseCase } from "../subscription/application/use-cases/SendSubscriptionConfirmationEmail.use-case";
import { OrganizationModule } from "../organization/organization.module";
import { ClassLimitReachedEventHandler } from "./application/handlers/class-limit-reached.handler";
import { SubscriptionUpgradedEventHandler } from "./application/handlers/subscription-upgraded.handler";
import { TrialEndingSoonEventHandler } from "./application/handlers/trial-ending-soon.handler";
import { ReportGeneratedEventHandler } from "./application/handlers/report-generated.handler";
import { AlertGeneratedEventHandler } from "./application/handlers/alert-generated.handler";
import { SubjectCreatedEventHandler } from "./application/handlers/subject-created.handler";
import { CreatePushNotificationUseCase } from "./application/use-cases/create-push-notification.use-case";
import { GetNotificationsUseCase } from "./application/use-cases/get-notifications.use-case";
import { MarkNotificationReadUseCase } from "./application/use-cases/mark-notification-read.use-case";
import { MarkAllNotificationsReadUseCase } from "./application/use-cases/mark-all-notifications-read.use-case";
import { NotificationController } from "./interface/controllers/notification.controller";
import { IMembershipRepository } from "../organization/domain/repositories/membership.repository";
import { IUserRepository } from "../organization/domain/repositories/user.repository";
import { SubjectModule } from "../subject/subject.module";
import { ISubjectRepository } from "../subject/domain/repositories/subject.repository";
import { NotificationGateway } from "./infrastructure/gateways/notification.gateway";
import { PushProvider } from "./infrastructure/providers/push.provider";
import { INotificationGateway } from "./application/gateways/notification-gateway.interface";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([NotificationModel]),
    forwardRef(() => CoreModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => OrganizationModule),
    forwardRef(() => SubjectModule),
  ],
  providers: [
    LoggerService,
    NotificationDomainService,
    NotificationRepository,
    {
      provide: EmailProvider,
      useFactory: (configService: ConfigService) =>
        EmailProvider.getInstance(configService),
      inject: [ConfigService],
    },
    {
      provide: NotificationGateway,
      useFactory: (
        jwtService: JwtService,
        configService: ConfigService,
        subjectRepository: ISubjectRepository
      ) =>
        new NotificationGateway(jwtService, configService, subjectRepository),
      inject: [JwtService, ConfigService, "SUBJECT_REPOSITORY"],
    },
    {
      provide: "NOTIFICATION_GATEWAY",
      useExisting: NotificationGateway,
    },
    {
      provide: PushProvider,
      useFactory: (gateway: INotificationGateway) => new PushProvider(gateway),
      inject: ["NOTIFICATION_GATEWAY"],
    },
    {
      provide: CreateEmailNotificationUseCase,
      useFactory: (
        notificationDomainService: NotificationDomainService,
        notificationRepository: INotificationRespository,
        notificationProvider: INotificationProvider
      ) =>
        new CreateEmailNotificationUseCase(
          notificationDomainService,
          notificationRepository,
          notificationProvider
        ),
      inject: [
        NotificationDomainService,
        NotificationRepository,
        EmailProvider,
      ],
    },
    {
      provide: UserCreatedEventHandler,
      useFactory: (
        logger: ILoggerService,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase
      ) => new UserCreatedEventHandler(logger, createEmailNotificationUseCase),
      inject: [LoggerService, CreateEmailNotificationUseCase],
    },
    {
      provide: InvitationSentEventHandler,
      useFactory: (
        logger: ILoggerService,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase
      ) =>
        new InvitationSentEventHandler(logger, createEmailNotificationUseCase),
      inject: [LoggerService, CreateEmailNotificationUseCase],
    },
    {
      provide: ClassCreatedEventHandler,
      useFactory: (
        logger: ILoggerService,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase
      ) => new ClassCreatedEventHandler(logger, createEmailNotificationUseCase),
      inject: [LoggerService, CreateEmailNotificationUseCase],
    },
    {
      provide: InvitationAcceptedEventHandler,
      useFactory: (
        logger: ILoggerService,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase
      ) =>
        new InvitationAcceptedEventHandler(
          logger,
          createEmailNotificationUseCase
        ),
      inject: [LoggerService, CreateEmailNotificationUseCase],
    },
    {
      provide: ClassArchivedEventHandler,
      useFactory: (
        logger: ILoggerService,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase
      ) =>
        new ClassArchivedEventHandler(logger, createEmailNotificationUseCase),
      inject: [LoggerService, CreateEmailNotificationUseCase],
    },
    {
      provide: SubscriptionActivatedEventHandler,
      useFactory: (
        logger: ILoggerService,
        sendSubscriptionConfirmationEmailUseCase: SendSubscriptionConfirmationEmailUseCase
      ) =>
        new SubscriptionActivatedEventHandler(
          logger,
          sendSubscriptionConfirmationEmailUseCase
        ),
      inject: [LoggerService, SendSubscriptionConfirmationEmailUseCase],
    },
    {
      provide: ClassLimitReachedEventHandler,
      useFactory: (
        logger: ILoggerService,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase,
        membershipRepository: IMembershipRepository,
        userRepository: IUserRepository
      ) =>
        new ClassLimitReachedEventHandler(
          logger,
          createEmailNotificationUseCase,
          membershipRepository,
          userRepository
        ),
      inject: [
        LoggerService,
        CreateEmailNotificationUseCase,
        "MEMBERSHIP_REPOSITORY",
        "USER_REPOSITORY",
      ],
    },
    {
      provide: SubscriptionUpgradedEventHandler,
      useFactory: (
        logger: ILoggerService,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase
      ) =>
        new SubscriptionUpgradedEventHandler(
          logger,
          createEmailNotificationUseCase
        ),
      inject: [LoggerService, CreateEmailNotificationUseCase],
    },
    {
      provide: TrialEndingSoonEventHandler,
      useFactory: (
        logger: ILoggerService,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase
      ) =>
        new TrialEndingSoonEventHandler(logger, createEmailNotificationUseCase),
      inject: [LoggerService, CreateEmailNotificationUseCase],
    },
    {
      provide: CreatePushNotificationUseCase,
      useFactory: (
        notificationDomainService: NotificationDomainService,
        notificationRepository: INotificationRespository
      ) =>
        new CreatePushNotificationUseCase(
          notificationDomainService,
          notificationRepository
        ),
      inject: [NotificationDomainService, NotificationRepository],
    },
    {
      provide: ReportGeneratedEventHandler,
      useFactory: (
        logger: ILoggerService,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase,
        createPushNotificationUseCase: CreatePushNotificationUseCase,
        membershipRepository: IMembershipRepository,
        userRepository: IUserRepository
      ) =>
        new ReportGeneratedEventHandler(
          logger,
          createEmailNotificationUseCase,
          createPushNotificationUseCase,
          membershipRepository,
          userRepository
        ),
      inject: [
        LoggerService,
        CreateEmailNotificationUseCase,
        CreatePushNotificationUseCase,
        "MEMBERSHIP_REPOSITORY",
        "USER_REPOSITORY",
      ],
    },
    {
      provide: AlertGeneratedEventHandler,
      useFactory: (
        logger: ILoggerService,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase,
        createPushNotificationUseCase: CreatePushNotificationUseCase,
        membershipRepository: IMembershipRepository,
        userRepository: IUserRepository
      ) =>
        new AlertGeneratedEventHandler(
          logger,
          createEmailNotificationUseCase,
          createPushNotificationUseCase,
          membershipRepository,
          userRepository
        ),
      inject: [
        LoggerService,
        CreateEmailNotificationUseCase,
        CreatePushNotificationUseCase,
        "MEMBERSHIP_REPOSITORY",
        "USER_REPOSITORY",
      ],
    },
    {
      provide: SubjectCreatedEventHandler,
      useFactory: (
        logger: ILoggerService,
        createEmailNotificationUseCase: CreateEmailNotificationUseCase
      ) =>
        new SubjectCreatedEventHandler(logger, createEmailNotificationUseCase),
      inject: [LoggerService, CreateEmailNotificationUseCase],
    },
    {
      provide: GetNotificationsUseCase,
      useFactory: (
        logger: ILoggerService,
        notificationRepository: INotificationRespository,
        subjectRepository: any
      ) =>
        new GetNotificationsUseCase(
          logger,
          notificationRepository,
          subjectRepository
        ),
      inject: [LoggerService, NotificationRepository, "SUBJECT_REPOSITORY"],
    },
    {
      provide: MarkNotificationReadUseCase,
      useFactory: (
        logger: ILoggerService,
        notificationRepository: INotificationRespository
      ) => new MarkNotificationReadUseCase(logger, notificationRepository),
      inject: [LoggerService, NotificationRepository],
    },
    {
      provide: MarkAllNotificationsReadUseCase,
      useFactory: (
        logger: ILoggerService,
        notificationRepository: INotificationRespository
      ) => new MarkAllNotificationsReadUseCase(logger, notificationRepository),
      inject: [LoggerService, NotificationRepository],
    },
  ],
  controllers: [NotificationController],
  exports: [CreateEmailNotificationUseCase, CreatePushNotificationUseCase],
})
export class NotificationModule {
  constructor(
    private readonly eventHandlerRegistry: EventHandlerRegistry,
    private readonly userCreatedEventHandler: UserCreatedEventHandler,
    private readonly invitationSentEventHandler: InvitationSentEventHandler,
    private readonly emailNotificationProvider: EmailProvider,
    private readonly pushProvider: PushProvider,
    private readonly classCreatedEventHandler: ClassCreatedEventHandler,
    private readonly invitationAcceptedEventHandler: InvitationAcceptedEventHandler,
    private readonly classArchivedEventHandler: ClassArchivedEventHandler,
    private readonly subscriptionActivatedEventHandler: SubscriptionActivatedEventHandler,
    private readonly classLimitReachedEventHandler: ClassLimitReachedEventHandler,
    private readonly subscriptionUpgradedEventHandler: SubscriptionUpgradedEventHandler,
    private readonly trialEndingSoonEventHandler: TrialEndingSoonEventHandler,
    private readonly reportGeneratedEventHandler: ReportGeneratedEventHandler,
    private readonly alertGeneratedEventHandler: AlertGeneratedEventHandler,
    private readonly subjectCreatedEventHandler: SubjectCreatedEventHandler
  ) {}

  async onModuleInit() {
    NotificationProviderFactory.register(
      NotificationMode.EMAIL,
      this.emailNotificationProvider
    );
    NotificationProviderFactory.register(
      NotificationMode.PUSH,
      this.pushProvider
    );

    this.eventHandlerRegistry.registerHandler(
      "signup.succeed",
      this.userCreatedEventHandler
    );

    this.eventHandlerRegistry.registerHandler(
      "invitation.sent",
      this.invitationSentEventHandler
    );

    this.eventHandlerRegistry.registerHandler(
      "class.created",
      this.classCreatedEventHandler
    );

    this.eventHandlerRegistry.registerHandler(
      "invitation.accepted",
      this.invitationAcceptedEventHandler
    );

    this.eventHandlerRegistry.registerHandler(
      "class.archived",
      this.classArchivedEventHandler
    );

    this.eventHandlerRegistry.registerHandler(
      "subscription.activated",
      this.subscriptionActivatedEventHandler
    );

    this.eventHandlerRegistry.registerHandler(
      "class.limit.reached",
      this.classLimitReachedEventHandler
    );

    this.eventHandlerRegistry.registerHandler(
      "subscription.upgraded",
      this.subscriptionUpgradedEventHandler
    );

    this.eventHandlerRegistry.registerHandler(
      "subscription.trial.ending.soon",
      this.trialEndingSoonEventHandler
    );

    this.eventHandlerRegistry.registerHandler(
      "report.generated",
      this.reportGeneratedEventHandler
    );

    this.eventHandlerRegistry.registerHandler(
      "alert.generated",
      this.alertGeneratedEventHandler
    );

    this.eventHandlerRegistry.registerHandler(
      "subject.created",
      this.subjectCreatedEventHandler
    );
  }
}
