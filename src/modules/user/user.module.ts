import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import {
  IEventStore,
  ILoggerService,
  LoggerService,
  EventStore,
  EventHandlerRegistry,
} from "src/core";
import { CoreModule } from "src/core/core.module";
import { User } from "./infrastructure/models/user.model";
import { UserDomainService } from "./domain/services/user.domain.service";
import { CreateUserUseCase } from "./application/use-cases/CreateUser.use-case";
import { UserController } from "./interface/controllers/user.controller";
import { AuthIdentityCreatedHandler } from "./application/handlers/AuthIdentityCreated.handler";
import { IUserRepository } from "./domain/repositories/user.repository";
import { UserRepository } from "./infrastructure/repositories/user.repository";
import { UserFacade } from "./application/facades/user.facade";

@Module({
  imports: [TypeOrmModule.forFeature([User]), CoreModule],
  controllers: [UserController],
  providers: [
    { provide: LoggerService, useClass: LoggerService },
    { provide: UserDomainService, useClass: UserDomainService },
    { provide: UserRepository, useClass: UserRepository },
    {
      provide: CreateUserUseCase,
      useFactory: (
        logger: LoggerService,
        eventStore: EventStore,
        userDomainService: UserDomainService,
        userRepository: IUserRepository
      ) =>
        new CreateUserUseCase(
          logger,
          eventStore,
          userDomainService,
          userRepository
        ),
      inject: [LoggerService, EventStore, UserDomainService, UserRepository],
    },
    {
      provide: EventHandlerRegistry,
      useFactory: (logger: ILoggerService, eventStore: IEventStore) =>
        new EventHandlerRegistry(eventStore, logger),
      inject: [LoggerService, EventStore],
    },
    {
      provide: AuthIdentityCreatedHandler,
      useFactory: (
        logger: ILoggerService,
        eventStore: EventStore,
        createUserUseCase: CreateUserUseCase
      ) =>
        new AuthIdentityCreatedHandler(logger, eventStore, createUserUseCase),
      inject: [LoggerService, EventStore, CreateUserUseCase],
    },
    {
      provide: UserFacade,
      useFactory: (createUserUseCase: CreateUserUseCase) =>
        new UserFacade(createUserUseCase),
      inject: [CreateUserUseCase],
    },
  ],
  exports: [UserFacade],
})
export class UserModule {
  constructor() {}
}
