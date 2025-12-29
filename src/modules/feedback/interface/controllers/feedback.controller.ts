import { Controller, Get, Query, Param, UseGuards, Req } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
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
import { FeedbackFacade } from "../../application/facades/feedback.facade";

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@ApiTags("Feedback")
@Controller("v1/feedback")
export class FeedbackController extends BaseController {
  constructor(private readonly feedbackFacade: FeedbackFacade) {
    super();
  }

  @Get("subjects")
  @ApiOperation({
    summary: "Récupérer la liste des matières avec feedback",
    description:
      "Récupère la liste des matières avec leurs statistiques de feedback. Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Liste des matières récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async getFeedbackSubjects(
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
    @Query("tab") tab?: "ongoing" | "finished",
    @Query("search") search?: string,
    @Query("sort") sort?: "plus_recent" | "plus_anciens",
    @Query("filter") filter?: "tous" | "pendant_cours" | "fin_cours"
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.feedbackFacade.getFeedbackSubjects({
      organizationId,
      userId: user.userId,
      tab,
      search,
      sort,
      filter,
    });

    return this.success(result);
  }

  @Get("subjects/:subjectId/moments/:momentId")
  @ApiOperation({
    summary: "Récupérer les feedbacks d'une matière et d'un moment",
    description:
      "Récupère les feedbacks détaillés pour une matière et un moment (quiz) spécifique. Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Feedbacks récupérés avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Matière ou moment non trouvé" })
  async getFeedbackBySubject(
    @Param("subjectId") subjectId: string,
    @Param("momentId") momentId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.feedbackFacade.getFeedbackBySubject({
      organizationId,
      userId: user.userId,
      subjectId,
      momentId,
    });

    return this.success(result);
  }
}
