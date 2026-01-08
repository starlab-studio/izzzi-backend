import { Module } from "@nestjs/common";
import { ILoggerService, LoggerService, EventStore } from "src/core";
import { CoreModule } from "src/core/core.module";
import { ReportController } from "./interface/controllers/report.controller";
import { ReportFacade } from "./application/facades/report.facade";
import { CreateReportUseCase } from "./application/use-cases/CreateReport.use-case";

@Module({
  imports: [CoreModule],
  controllers: [ReportController],
  providers: [
    LoggerService,
    {
      provide: CreateReportUseCase,
      useFactory: (logger: ILoggerService, eventStore: EventStore) =>
        new CreateReportUseCase(logger, eventStore),
      inject: [LoggerService, EventStore],
    },
    {
      provide: ReportFacade,
      useFactory: (createReportUseCase: CreateReportUseCase) =>
        new ReportFacade(createReportUseCase),
      inject: [CreateReportUseCase],
    },
  ],
  exports: [ReportFacade],
})
export class ReportModule {}
