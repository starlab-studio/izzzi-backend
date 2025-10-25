import { Module, OnModuleInit } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

import { AppDataSource } from "src/data-source";
import { EventStore } from "./infrastructure/services/event.store";
import { EventHandlerRegistry } from "./application/handlers/handler.registry";
import { TypeOrmUnitOfWork } from "./infrastructure/unit-of-work/typeOrm.unit-of-work";

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
    EventStore,
    EventHandlerRegistry,
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
  async onModuleInit() {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  }
}
