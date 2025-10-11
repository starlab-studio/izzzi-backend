import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";

import { AuthController } from "./interface/controllers/auth.controller";
import { AuthService } from "./application/services/auth.service";
import { LoggerService, EventStore } from "src/core";
import { AuthIdentity } from "./infrastructure/models/authIdentity.model";
import { AuthIdentityRepository } from "./infrastructure/repositories/authIdentity.repository";
import { AuthIdentityFactory } from "./infrastructure/factories/auth.factory";
import { IAuthStrategy } from "./domain/types";
import { CoreModule } from "src/core/core.module";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([AuthIdentity]), CoreModule],
  controllers: [AuthController],
  providers: [
    LoggerService,
    AuthIdentityRepository,
    AuthIdentityFactory,
    { provide: "LOGGER_SERVICE", useClass: LoggerService },
    { provide: "QUEUE", useFactory: () => new Queue("event") },
    {
      provide: "EVENT_STORE",
      useFactory: (queue: Queue) => new EventStore(queue),
      inject: ["QUEUE"],
    },
    { provide: "AUTH_IDENTITY_REPOSITORY", useClass: AuthIdentityRepository },
    {
      provide: "AUTH_IDENTITY_PROVIDER",
      useFactory: (
        factory: AuthIdentityFactory,
        configService: ConfigService
      ): IAuthStrategy => {
        const provider = configService.get("auth.provider");
        return factory.create(provider);
      },
      inject: [AuthIdentityFactory, ConfigService],
    },
    {
      provide: AuthService,
      useFactory: (
        logger: LoggerService,
        eventStore: EventStore,
        repository: AuthIdentityRepository,
        authProvider: IAuthStrategy
      ) => new AuthService(logger, eventStore, repository, authProvider),
      inject: [
        "LOGGER_SERVICE",
        "EVENT_STORE",
        "AUTH_IDENTITY_REPOSITORY",
        "AUTH_IDENTITY_PROVIDER",
      ],
    },
  ],
})
export class AuthModule {}
