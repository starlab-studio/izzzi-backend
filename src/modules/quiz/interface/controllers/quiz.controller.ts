import { Controller, Get, Post, Put, Param, Body, UseGuards, Req, Res } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from "@nestjs/swagger";
import type { Response } from "express";
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
import { AssignQuizPairDto } from "../dto/quiz.dto";

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@ApiTags("Quizzes")
@Controller("v1/subjects")
export class QuizController extends BaseController {
  constructor(private readonly quizFacade: QuizFacade) {
    super();
  }

  @Post(":subjectId/quizzes/assign")
  @ApiOperation({
    summary: "Assigner une paire de templates à une matière",
    description: "Crée deux quiz (during_course et after_course) pour une matière. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiParam({
    name: "subjectId",
    description: "ID de la matière",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 201,
    description: "Questionnaires assignés avec succès",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Matière ou template pair non trouvé" })
  async assignQuizPair(
    @Param("subjectId") subjectId: string,
    @Body() dto: AssignQuizPairDto,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
  ) {
    // organizationId is validated by RolesGuard and set in request.organizationId
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.quizFacade.assignQuizPairToSubject({
      subjectId,
      templatePairId: dto.templatePairId,
      organizationId,
      userId: user.userId,
    });

    return this.success(result);
  }

  @Put(":subjectId/quizzes/reassign")
  @ApiOperation({
    summary: "Modifier le duo de questionnaires d'une matière",
    description: "Modifie le duo de questionnaires d'une matière. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN. \
    Contrainte : modification possible uniquement si le questionnaire 'en cours' n'a aucune réponse.",
  })
  @ApiParam({
    name: "subjectId",
    description: "ID de la matière",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Questionnaires modifiés avec succès",
  })
  @ApiResponse({ status: 400, description: "Des réponses existent déjà" })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Matière ou template pair non trouvé" })
  async reassignQuizPair(
    @Param("subjectId") subjectId: string,
    @Body() dto: AssignQuizPairDto,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
  ) {
    // organizationId is validated by RolesGuard and set in request.organizationId
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.quizFacade.reassignQuizPairToSubject({
      subjectId,
      templatePairId: dto.templatePairId,
      organizationId,
      userId: user.userId,
    });

    return this.success(result);
  }

  @Get(":subjectId/quizzes")
  @ApiOperation({
    summary: "Récupérer les quiz d'une matière",
    description: "Récupère tous les quiz (during_course et after_course) d'une matière. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiParam({
    name: "subjectId",
    description: "ID de la matière",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Liste des quiz récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Matière non trouvée" })
  async getQuizzesBySubject(
    @Param("subjectId") subjectId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.quizFacade.getQuizzesBySubject({
      subjectId,
      organizationId,
      userId: user.userId,
    });

    return this.success(result);
  }
}

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@ApiTags("Quizzes")
@Controller("v1/quizzes")
export class QuizDetailController extends BaseController {
  constructor(private readonly quizFacade: QuizFacade) {
    super();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Récupérer un quiz par son ID",
    description: "Récupère les détails d'un quiz. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiParam({
    name: "id",
    description: "ID du quiz",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Quiz récupéré avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Quiz non trouvé" })
  async getQuizById(
    @Param("id") quizId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.quizFacade.getQuizById({
      quizId,
      organizationId,
      userId: user.userId,
    });

    return this.success(result);
  }

  @Get(":id/link")
  @ApiOperation({
    summary: "Récupérer le lien et le QR code d'un quiz",
    description: "Récupère le lien public et l'URL du QR code d'un quiz. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiParam({
    name: "id",
    description: "ID du quiz",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Lien récupéré avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Quiz non trouvé" })
  async getQuizLink(
    @Param("id") quizId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.quizFacade.getQuizLink({
      quizId,
      organizationId,
      userId: user.userId,
    });

    return this.success(result);
  }

  @Get(":id/qrcode")
  @ApiOperation({
    summary: "Télécharger le QR code d'un quiz",
    description: "Télécharge l'image du QR code d'un quiz. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiParam({
    name: "id",
    description: "ID du quiz",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "QR code téléchargé",
    content: {
      "image/png": {},
    },
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Quiz non trouvé ou QR code non disponible" })
  async getQuizQRCode(
    @Param("id") quizId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
    @Res() res: Response,
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.quizFacade.getQuizLink({
      quizId,
      organizationId,
      userId: user.userId,
    });

    if (!result.qrCodeUrl) {
      return res.status(404).json({
        success: false,
        error: "QR code not available",
      });
    }

    // Redirect to QR code URL (or fetch and return the image)
    return res.redirect(result.qrCodeUrl);
  }

  @Post(":id/send")
  @ApiOperation({
    summary: "Envoyer le questionnaire à tous les étudiants",
    description: "Envoie le questionnaire par email à tous les étudiants de la classe. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiParam({
    name: "id",
    description: "ID du quiz",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Questionnaire envoyé avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Quiz non trouvé" })
  async sendQuizToStudents(
    @Param("id") quizId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.quizFacade.sendQuizToStudents({
      quizId,
      organizationId,
      userId: user.userId,
    });

    return this.success(result);
  }

  @Post(":id/remind")
  @ApiOperation({
    summary: "Relancer les étudiants n'ayant pas répondu",
    description: "Envoie un email de relance aux étudiants qui n'ont pas encore répondu. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiParam({
    name: "id",
    description: "ID du quiz",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Relance envoyée avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Quiz non trouvé" })
  async remindQuizToStudents(
    @Param("id") quizId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.quizFacade.remindQuizToStudents({
      quizId,
      organizationId,
      userId: user.userId,
    });

    return this.success(result);
  }

  @Get(":id/statistics")
  @ApiOperation({
    summary: "Récupérer les statistiques des réponses d'un quiz",
    description: "Récupère les statistiques détaillées des réponses d'un quiz. \
    Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @ApiParam({
    name: "id",
    description: "ID du quiz",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Statistiques récupérées avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Quiz non trouvé" })
  async getQuizStatistics(
    @Param("id") quizId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.quizFacade.getQuizStatistics({
      quizId,
      organizationId,
      userId: user.userId,
    });

    return this.success(result);
  }
}

