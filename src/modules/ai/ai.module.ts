import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LoggerService, ILoggerService } from "src/core";
import { AiClientService } from "./application/services/ai-client.service";

@Module({
  imports: [ConfigModule],
  providers: [
    LoggerService,
    {
      provide: AiClientService,
      useFactory: (
        configService: ConfigService,
        loggerService: ILoggerService,
      ) => new AiClientService(configService, loggerService),
      inject: [ConfigService, LoggerService],
    },
  ],
  exports: [AiClientService],
})
export class AiModule {}
