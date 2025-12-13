import { Controller, Post, Body, UseGuards, Param } from "@nestjs/common";
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
import { CreateClassDto } from "../dto/class.dto";

@ApiTags("Classes")
@Controller("v1/organizations/:organizationId/classes")
export class ClassController extends BaseController {
  constructor(private readonly classFacade: ClassFacade) {
    super();
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
}
