import { Injectable } from "@nestjs/common";
import { CreateReportUseCase } from "../use-cases/CreateReport.use-case";
import { CreateReportInput, CreateReportOutput } from "../../domain/types";

@Injectable()
export class ReportFacade {
  constructor(private readonly createReportUseCase: CreateReportUseCase) {}

  async createReport(data: CreateReportInput): Promise<CreateReportOutput> {
    return this.createReportUseCase.execute(data);
  }
}
