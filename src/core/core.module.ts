import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

import { EventStore } from "./infrastructure/services/event.store";
import { EventHandlerRegistry } from "./application/handlers/handler.registry";

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
  providers: [EventStore, EventHandlerRegistry],
  exports: [EventStore, EventHandlerRegistry],
})
export class CoreModule {}
