import { Controller, Post, Get, Put, Body, UseGuards, Param, Query } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import {
  BaseController,
  AuthGuard,
  RolesGuard,
  CurrentUser,
  UserRole,
  Roles,
  type JWTPayload,
} from "src/core";
import { ClassFacade } from "../../application/facades/class.facade";
import { CreateClassDto, UpdateClassDto } from "../dto/class.dto";

@ApiTags("Classes")
@Controller("v1/organizations/:organizationId/classes")
export class ClassController extends BaseController {
  constructor(private readonly classFacade: ClassFacade) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: "Récupérer les classes d'une organisation",
    description: "Retourne la liste des classes de l'organisation spécifiée. \
    Utilisez le paramètre query 'archived' pour filtrer les classes archivées (true) ou actives (false). \
    Si non spécifié, retourne toutes les classes.",
  })
  @ApiBearerAuth()
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    example: "d405cc32-58ac-42a0-9c2d-e9e81398bc73",
  })
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: "Liste des classes récupérée avec succès",
    schema: {
      example: {
        success: true,
        data: [
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            name: "Terminale S1",
            code: "TERM-S1",
            description: "Classe de Terminale S spécialité Mathématiques",
            numberOfStudents: 25,
            studentEmails: ["etudiant1@example.com"],
            accessToken: "abc123...",
            isActive: true,
            organizationId: "d405cc32-58ac-42a0-9c2d-e9e81398bc73",
            userId: "b026ed83-a05d-4b22-bbcd-f32094d5567c",
            createdAt: "2025-01-06T12:00:00.000Z",
            updatedAt: "2025-01-06T12:00:00.000Z",
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async getClasses(
    @CurrentUser() user: JWTPayload,
    @Param("organizationId") organizationId: string,
    @Query("archived") archived?: string,
  ) {
    const archivedParam = archived === "true" ? true : archived === "false" ? false : undefined;
    const classes = await this.classFacade.getClassesByOrganization(
      organizationId,
      user.userId,
      archivedParam,
    );

    return this.success(classes);
  }

  @Post()
  @ApiOperation({ 
    summary: "Créer une nouvelle classe",
    description: "Crée une nouvelle classe dans l'organisation spécifiée. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiBearerAuth()
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    example: "d405cc32-58ac-42a0-9c2d-e9e81398bc73",
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({ 
    status: 201, 
    description: "Classe créée avec succès",
    schema: {
      example: {
        success: true,
        data: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Terminale S1",
          code: "TERM-S1",
          description: "Classe de Terminale S spécialité Mathématiques",
          numberOfStudents: 25,
          studentEmails: ["etudiant1@example.com", "etudiant2@example.com"],
          accessToken: "abc123...",
          isActive: true,
          organizationId: "d405cc32-58ac-42a0-9c2d-e9e81398bc73",
          userId: "b026ed83-a05d-4b22-bbcd-f32094d5567c",
          createdAt: "2025-01-06T12:00:00.000Z",
          updatedAt: "2025-01-06T12:00:00.000Z",
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit - Rôle insuffisant" })
  async createClass(
    @Body() dto: CreateClassDto,
    @CurrentUser() user: JWTPayload,
    @Param("organizationId") organizationId: string,
  ) {
    const createdClass = await this.classFacade.createClass(
      {
        ...dto,
        description: dto.description ?? null,
        organizationId: organizationId,
        userId: user.userId,
      },
      user.username,
    );

    return this.success(createdClass);
  }

  @Get(":classId")
  @ApiOperation({
    summary: "Récupérer une classe par son ID",
    description: "Récupère les détails d'une classe spécifique. \
    Nécessite le rôle LEARNING_MANAGER, ADMIN ou STUDENT.",
  })
  @ApiBearerAuth()
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    example: "d405cc32-58ac-42a0-9c2d-e9e81398bc73",
  })
  @ApiParam({
    name: "classId",
    description: "ID de la classe",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Classe récupérée avec succès",
    schema: {
      example: {
        success: true,
        data: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Terminale S1",
          code: "TERM-S1",
          description: "Classe de Terminale S spécialité Mathématiques",
          numberOfStudents: 25,
          studentEmails: ["etudiant1@example.com"],
          accessToken: "abc123...",
          isActive: true,
          organizationId: "d405cc32-58ac-42a0-9c2d-e9e81398bc73",
          userId: "b026ed83-a05d-4b22-bbcd-f32094d5567c",
          createdAt: "2025-01-06T12:00:00.000Z",
          updatedAt: "2025-01-06T12:00:00.000Z",
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Classe non trouvée" })
  async getClassById(
    @CurrentUser() user: JWTPayload,
    @Param("organizationId") organizationId: string,
    @Param("classId") classId: string,
  ) {
    const classData = await this.classFacade.getClassById(
      classId,
      organizationId,
      user.userId,
    );

    return this.success(classData);
  }

  @Put(":classId")
  @ApiOperation({
    summary: "Modifier une classe",
    description: "Met à jour les informations d'une classe. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiBearerAuth()
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    example: "d405cc32-58ac-42a0-9c2d-e9e81398bc73",
  })
  @ApiParam({
    name: "classId",
    description: "ID de la classe",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Classe modifiée avec succès",
    schema: {
      example: {
        success: true,
        data: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Terminale S1",
          code: "TERM-S1",
          description: "Classe de Terminale S spécialité Mathématiques",
          numberOfStudents: 25,
          studentEmails: ["etudiant1@example.com"],
          accessToken: "abc123...",
          isActive: true,
          organizationId: "d405cc32-58ac-42a0-9c2d-e9e81398bc73",
          userId: "b026ed83-a05d-4b22-bbcd-f32094d5567c",
          createdAt: "2025-01-06T12:00:00.000Z",
          updatedAt: "2025-01-06T12:00:00.000Z",
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit - Rôle insuffisant" })
  @ApiResponse({ status: 404, description: "Classe non trouvée" })
  async updateClass(
    @Body() dto: UpdateClassDto,
    @CurrentUser() user: JWTPayload,
    @Param("organizationId") organizationId: string,
    @Param("classId") classId: string,
  ) {
    const updatedClass = await this.classFacade.updateClass(
      classId,
      organizationId,
      user.userId,
      dto,
    );

    return this.success(updatedClass);
  }

  @Post(":classId/archive")
  @ApiOperation({
    summary: "Archiver une classe",
    description: "Archive une classe (désactive la classe). \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiBearerAuth()
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    example: "d405cc32-58ac-42a0-9c2d-e9e81398bc73",
  })
  @ApiParam({
    name: "classId",
    description: "ID de la classe",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Classe archivée avec succès",
    schema: {
      example: {
        success: true,
        data: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Terminale S1",
          code: "TERM-S1",
          description: "Classe de Terminale S spécialité Mathématiques",
          numberOfStudents: 25,
          studentEmails: ["etudiant1@example.com"],
          accessToken: "abc123...",
          isActive: false,
          organizationId: "d405cc32-58ac-42a0-9c2d-e9e81398bc73",
          userId: "b026ed83-a05d-4b22-bbcd-f32094d5567c",
          createdAt: "2025-01-06T12:00:00.000Z",
          updatedAt: "2025-01-06T12:00:00.000Z",
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit - Rôle insuffisant" })
  @ApiResponse({ status: 404, description: "Classe non trouvée" })
  async archiveClass(
    @CurrentUser() user: JWTPayload,
    @Param("organizationId") organizationId: string,
    @Param("classId") classId: string,
  ) {
    const archivedClass = await this.classFacade.archiveClass(
      classId,
      organizationId,
      user.userId,
    );

    return this.success(archivedClass);
  }
}
