import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

import { LoggerService } from "./infrastructure/services/logger.service";

@Module({
  providers: [LoggerService],
  imports: [
    BullModule.forRoot({
      connection: {
        host: "localhost",
        port: 6379,
      },
    }),
  ],
})
export class CoreModule {}
