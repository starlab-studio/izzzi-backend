import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserService } from "./application/services/user.service";
import { User } from "./infrastructure/models/user.model";
import { UserController } from "./interface/controllers/user.controller";
import {
  IEventStore,
  ILoggerService,
  LoggerService,
  EventStore,
  EventHandlerRegistry,
} from "src/core";
import { CoreModule } from "src/core/core.module";
import { AuthIdentityCreatedHandler } from "./application/handlers/AuthIdentityCreated.handler";
import { IUserRepository } from "./domain/repositories/user.repository";
import { UserRepository } from "./infrastructure/repositories/user.repository";

@Module({
  imports: [TypeOrmModule.forFeature([User]), CoreModule],
  controllers: [UserController],
  providers: [
    { provide: LoggerService, useClass: LoggerService },
    { provide: UserRepository, useClass: UserRepository },
    {
      provide: UserService,
      useFactory: (
        logger: ILoggerService,
        eventStore: IEventStore,
        repository: IUserRepository
      ) => new UserService(logger, eventStore, repository),
      inject: [LoggerService, EventStore, UserRepository],
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
        service: UserService
      ) => new AuthIdentityCreatedHandler(logger, eventStore, service),
      inject: [LoggerService, EventStore, UserService],
    },
  ],
})
export class UserModule {
  constructor(
    private readonly eventHandlerRegistry: EventHandlerRegistry,
    private readonly authIdentityCreatedHandler: AuthIdentityCreatedHandler
  ) {
    this.eventHandlerRegistry.registerHandler(
      "auth_identity.created",
      this.authIdentityCreatedHandler
    );
    this.eventHandlerRegistry.listen();
  }
}
