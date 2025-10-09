import { Module } from "@nestjs/common";

import { LoggerService } from "./infrastructure/services/logger.service";

@Module({
  providers: [LoggerService],
})
export class CoreModule {}
