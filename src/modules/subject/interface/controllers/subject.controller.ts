import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Put,
  Delete,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from "@nestjs/swagger";
import { SubjectFacade } from "../../application/facades/subject.facade";
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  BulkCreateSubjectsDto,
} from "../dto/subject.dto";
import {
  BaseController,
  UserRole,
  Roles,
  AuthGuard,
  RolesGuard,
  CurrentUser,
  type JWTPayload,
} from "src/core";

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@ApiTags("Subjects")
@Controller("v1/subjects")
export class SubjectController extends BaseController {
  constructor(private readonly subjectFacade: SubjectFacade) {
    super();
  }

  @Get("class/:classId")
  @ApiOperation({
    summary: "Récupérer les matières d'une classe",
    description:
      "Récupère toutes les matières actives assignées à une classe spécifique. \
    Nécessite le rôle LEARNING_MANAGER, ADMIN ou STUDENT.",
  })
  @ApiBearerAuth()
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Liste des matières récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Classe non trouvée" })
  async getSubjectsByClass(
    @Param("classId") classId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.subjectFacade.getSubjectsByClass({
      classId,
      organizationId,
      userId: user.userId,
    });

    return this.success(result);
  }

  @Post("bulk")
  @ApiOperation({
    summary: "Créer plusieurs matières en lot pour une classe",
    description:
      "Crée plusieurs matières et les assigne à une classe spécifique. \
    Si une matière existe déjà dans l'organisation, elle sera réutilisée. \
    Retourne un rapport avec le nombre de créations réussies et les erreurs éventuelles par ligne. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiBearerAuth()
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 201,
    description:
      "Résultat de la création en lot avec décompte et erreurs éventuelles",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Classe non trouvée" })
  async bulkCreateSubjects(
    @Body() dto: BulkCreateSubjectsDto,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
  ) {
    // organizationId is validated by RolesGuard and set in request.organizationId
    const organizationId = request.organizationId || dto.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.subjectFacade.bulkCreateSubjects({
      classId: dto.classId,
      organizationId,
      userId: user.userId,
      userEmail: user.username,
      subjects: dto.subjects.map((subject) => ({
        classId: dto.classId,
        organizationId,
        userId: user.userId,
        userEmail: user.username,
        name: subject.name,
        instructorName: subject.instructorName,
        instructorEmail: subject.instructorEmail,
        firstCourseDate: subject.firstCourseDate,
        lastCourseDate: subject.lastCourseDate,
      })),
    });

    return this.success(result);
  }

  @Post()
  @ApiOperation({
    summary: "Créer une nouvelle matière pour une classe",
    description:
      "Crée une matière et l'assigne à une classe spécifique. \
    Si la matière existe déjà dans l'organisation, elle sera réutilisée. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiBearerAuth()
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 201,
    description: "Matière créée et assignée à la classe avec succès",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Classe non trouvée" })
  async createSubject(
    @Body() dto: CreateSubjectDto,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
  ) {
    // organizationId is validated by RolesGuard and set in request.organizationId
    const organizationId = request.organizationId || dto.organizationId;

    const result = await this.subjectFacade.createSubject({
      classId: dto.classId,
      organizationId,
      userId: user.userId,
      userEmail: user.username,
      name: dto.name,
      instructorName: dto.instructorName,
      instructorEmail: dto.instructorEmail,
      firstCourseDate: dto.firstCourseDate,
      lastCourseDate: dto.lastCourseDate,
    });

    return this.success(result);
  }

  @Put(":subjectId")
  @ApiOperation({
    summary: "Modifier une matière",
    description:
      "Met à jour les informations d'une matière. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiBearerAuth()
  @ApiParam({
    name: "subjectId",
    description: "ID de la matière",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Matière modifiée avec succès",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Matière non trouvée" })
  async updateSubject(
    @Param("subjectId") subjectId: string,
    @Body() dto: UpdateSubjectDto,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.subjectFacade.updateSubject({
      subjectId,
      organizationId,
      userId: user.userId,
      name: dto.name,
      instructorName: dto.instructorName,
      instructorEmail: dto.instructorEmail,
      firstCourseDate: dto.firstCourseDate,
      lastCourseDate: dto.lastCourseDate,
    });

    return this.success(result);
  }

  @Delete(":subjectId")
  @ApiOperation({
    summary: "Supprimer une matière",
    description:
      "Supprime une matière et toutes ses assignations. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiBearerAuth()
  @ApiParam({
    name: "subjectId",
    description: "ID de la matière",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Matière supprimée avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Matière non trouvée" })
  async deleteSubject(
    @Param("subjectId") subjectId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    await this.subjectFacade.deleteSubject({
      subjectId,
      organizationId,
      userId: user.userId,
    });

    return this.success({ message: "Subject deleted successfully" });
  }
}
