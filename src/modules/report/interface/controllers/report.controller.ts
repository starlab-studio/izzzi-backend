import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { BaseController, AuthGuard } from "src/core";
import { ReportFacade } from "../../application/facades/report.facade";
import { CreateReportDto } from "../dto/report.dto";

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags("Reports")
@Controller("v1/reports")
export class ReportController extends BaseController {
  constructor(private readonly reportFacade: ReportFacade) {
    super();
  }

  @Post()
  @ApiOperation({
    summary: "Recevoir un rapport hebdomadaire depuis Langchain",
    description:
      "Endpoint appelé par le service Langchain pour envoyer les rapports hebdomadaires générés. Déclenche l'envoi d'email et de notifications push.",
  })
  @ApiResponse({
    status: 200,
    description: "Rapport reçu et notifications envoyées avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  async createReport(@Body() body: CreateReportDto) {
    const result = await this.reportFacade.createReport({
      organizationId: body.organizationId,
      organizationName: body.organizationName,
      reportContent: body.reportContent,
      subjectIds: body.subjectIds,
    });

    return this.success(result);
  }
}
