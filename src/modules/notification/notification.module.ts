import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

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

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([NotificationModel]),
    CoreModule,
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
      provide: CreateEmailNotificationUseCase,
      useFactory: (
        notificationDomainService: NotificationDomainService,
        notificationRepository: INotificationRespository,
        notificationProvider: INotificationProvider,
      ) =>
        new CreateEmailNotificationUseCase(
          notificationDomainService,
          notificationRepository,
          notificationProvider,
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
        createEmailNotificationUseCase: CreateEmailNotificationUseCase,
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
        createEmailNotificationUseCase: CreateEmailNotificationUseCase,
      ) => new ClassCreatedEventHandler(logger, createEmailNotificationUseCase),
      inject: [LoggerService, CreateEmailNotificationUseCase],
    },
  ],
})
export class NotificationModule {
  constructor(
    private readonly eventHandlerRegistry: EventHandlerRegistry,
    private readonly userCreatedEventHandler: UserCreatedEventHandler,
    private readonly invitationSentEventHandler: InvitationSentEventHandler,
    private readonly emailNotificationProvider: EmailProvider,
    private readonly classCreatedEventHandler: ClassCreatedEventHandler,
  ) {}

  async onModuleInit() {
    NotificationProviderFactory.register(
      NotificationMode.EMAIL,
      this.emailNotificationProvider,
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
      this.classCreatedEventHandler,
    );
  }
}
