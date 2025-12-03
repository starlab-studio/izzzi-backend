import { Module, OnModuleInit, forwardRef } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

import { CacheModule } from "@nestjs/cache-manager";
import KeyvRedis from "@keyv/redis";
import { Keyv } from "keyv";
import { CacheableMemory } from "cacheable";

import { AppDataSource } from "src/data-source";
import { ILoggerService } from "./application/services/logger.service";
import { LoggerService } from "./infrastructure/services/logger.service";
import { EventStore } from "./infrastructure/services/event.store";
import { EventHandlerRegistry } from "./application/handlers/handler.registry";
import { TypeOrmUnitOfWork } from "./infrastructure/unit-of-work/typeOrm.unit-of-work";
import { AuthGuard } from "./interfaces/guards/auth.guard";
import { RolesGuard } from "./interfaces/guards/role.guard";
import { CacheStoreAdapter } from "./infrastructure/services/cache-store.adapter";
import { OrganizationModule } from "src/modules/organization/organization.module";

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
    CacheModule.registerAsync({
      useFactory: async () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            new KeyvRedis("redis://localhost:6379"),
          ],
        };
      },
    }),
    forwardRef(() => OrganizationModule),
  ],
  providers: [
    LoggerService,
    EventStore,
    {
      provide: "CACHE_SERVICE",
      useClass: CacheStoreAdapter,
    },
    AuthGuard,
    RolesGuard,
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
    "CACHE_SERVICE",
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
