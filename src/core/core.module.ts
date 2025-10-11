import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { Queue } from "bullmq";

import { LoggerService } from "./infrastructure/services/logger.service";
import { EventStore } from "./infrastructure/services/event.store";

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: "localhost",
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: "event",
    }),
  ],
  providers: [
    { provide: "QUEUE", useFactory: () => new Queue("event") },
    {
      provide: EventStore,
      useFactory: (queue: Queue) => new EventStore(queue),
      inject: ["QUEUE"],
    },
  ],
  exports: [EventStore],
})
export class CoreModule {}
