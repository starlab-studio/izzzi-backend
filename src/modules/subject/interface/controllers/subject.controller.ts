import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { SubjectFacade } from "../../application/facades/subject.facade";
import type { JWTPayload } from "src/modules/auth/infrastructure/factories/custom.adapter";
import { CreateSubjectDto } from "../dto/subject.dto";
import {
  BaseController,
  Role,
  Roles,
  AuthGuard,
  RolesGuard,
  CurrentUser,
} from "src/core";

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@ApiTags("Subjects")
@Controller("v1/subjects")
export class SubjectController extends BaseController {
  constructor(private readonly subjectFacade: SubjectFacade) {
    super();
  }

  @Post()
  @ApiOperation({ summary: "Créer une nouvelle matière" })
  @ApiBearerAuth()
  @Roles(Role.LEARNING_MANAGER)
  @ApiResponse({ status: 201, description: "Matière créée avec succès" })
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async createSubject(
    @Body() dto: CreateSubjectDto,
    @CurrentUser() user: JWTPayload,
  ) {
    const createdSubject = await this.subjectFacade.createSubject(
      {
        ...dto,
        description: dto.description ?? null,
        organizationId: user.roles[0].organizationId,
        createdBy: user.userId,
      },
      user.username,
    );

    return this.success(createdSubject);
  }
}
