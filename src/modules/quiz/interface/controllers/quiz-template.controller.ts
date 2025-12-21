import { Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from "@nestjs/swagger";
import {
  BaseController,
  UserRole,
  Roles,
  AuthGuard,
  RolesGuard,
  CurrentUser,
  type JWTPayload,
} from "src/core";
import { QuizFacade } from "../../application/facades/quiz.facade";

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@ApiTags("Quiz Templates")
@Controller("v1/organizations/:organizationId/quiz-templates")
export class QuizTemplateController extends BaseController {
  constructor(private readonly quizFacade: QuizFacade) {
    super();
  }

  @Get("pairs")
  @ApiOperation({
    summary: "Récupérer les paires de templates de questionnaires",
    description: "Récupère toutes les paires de templates actives disponibles. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    example: "d405cc32-58ac-42a0-9c2d-e9e81398bc73",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Liste des paires de templates récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async getTemplatePairs(
    @CurrentUser() user: JWTPayload,
    @Param("organizationId") organizationId: string,
  ) {
    const result = await this.quizFacade.getQuizTemplatePairs({
      organizationId,
      userId: user.userId,
    });

    return this.success(result);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Récupérer un template avec ses questions",
    description: "Récupère un template de questionnaire avec toutes ses questions pour l'aperçu. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    example: "d405cc32-58ac-42a0-9c2d-e9e81398bc73",
  })
  @ApiParam({
    name: "id",
    description: "ID du template",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Template récupéré avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Template non trouvé" })
  async getTemplateById(
    @Param("organizationId") organizationId: string,
    @Param("id") templateId: string,
    @CurrentUser() user: JWTPayload,
  ) {
    const result = await this.quizFacade.getQuizTemplateById({
      templateId,
      organizationId,
      userId: user.userId,
    });

    return this.success(result);
  }

  @Post()
  @ApiOperation({
    summary: "Créer un template de questionnaire personnalisé",
    description: "Crée un nouveau template de questionnaire avec ses questions. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    example: "d405cc32-58ac-42a0-9c2d-e9e81398bc73",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 201,
    description: "Template créé avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async createTemplate(
    @Param("organizationId") organizationId: string,
    @Body() body: {
      name: string;
      type: "during_course" | "after_course";
      description?: string | null;
      previewImageUrl?: string | null;
      questions: {
        text: string;
        type: "stars" | "radio" | "checkbox" | "textarea";
        options: string[] | null;
        validationRules: {
          required?: boolean;
          min_length?: number;
          max_length?: number;
        } | null;
        orderIndex: number;
        category: "global" | "course" | "instructor";
      }[];
    },
    @CurrentUser() user: JWTPayload,
  ) {
    const result = await this.quizFacade.createQuizTemplate({
      name: body.name,
      type: body.type,
      description: body.description ?? null,
      previewImageUrl: body.previewImageUrl ?? null,
      questions: body.questions,
      organizationId,
      userId: user.userId,
    });

    return this.success(result);
  }
}

