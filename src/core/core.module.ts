import { Module, OnModuleInit } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

import { AppDataSource } from "src/data-source";
import { ILoggerService } from "./application/services/logger.service";
import { LoggerService } from "./infrastructure/services/logger.service";
import { EventStore } from "./infrastructure/services/event.store";
import { EventHandlerRegistry } from "./application/handlers/handler.registry";
import { TypeOrmUnitOfWork } from "./infrastructure/unit-of-work/typeOrm.unit-of-work";
import { AuthGuard } from "./interfaces/guards/auth.guard";

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: "localhost",
        port: 6379,
        keepAlive: 1,
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
      },
    }),
    BullModule.registerQueue({
      name: "event",
    }),
  ],
  providers: [
    LoggerService,
    EventStore,
    AuthGuard,
    {
      provide: EventHandlerRegistry,
      useFactory: (logger: ILoggerService, eventStore: EventStore) =>
        new EventHandlerRegistry(eventStore, logger),
      inject: [LoggerService, EventStore],
    },
    {
      provide: TypeOrmUnitOfWork,
      useFactory: () => new TypeOrmUnitOfWork(AppDataSource),
    },
  ],
  exports: [
    EventStore,
    EventHandlerRegistry,
    {
      provide: TypeOrmUnitOfWork,
      useFactory: () => new TypeOrmUnitOfWork(AppDataSource),
    },
  ],
})
export class CoreModule implements OnModuleInit {
  constructor(private readonly eventHandlerRegistry: EventHandlerRegistry) {}
  async onModuleInit() {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    this.eventHandlerRegistry.listen();
  }
}
