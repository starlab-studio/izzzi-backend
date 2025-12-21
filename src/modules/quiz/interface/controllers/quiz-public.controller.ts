import { Controller, Get, Post, Param, Body, Req } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from "@nestjs/swagger";
import { BaseController } from "src/core";
import { QuizFacade } from "../../application/facades/quiz.facade";

@ApiTags("Public Quizzes")
@Controller("v1/public/quizzes")
export class QuizPublicController extends BaseController {
  constructor(private readonly quizFacade: QuizFacade) {
    super();
  }

  @Get(":accessToken")
  @ApiOperation({
    summary: "Récupérer un quiz par son access token (public)",
    description: "Récupère les détails d'un quiz via son access token. Endpoint public, pas d'authentification requise.",
  })
  @ApiParam({
    name: "accessToken",
    description: "Token d'accès du quiz",
    example: "c5a7f1be70ed961028b91dfd23f2bf5a5deecd5016a4d921caeb913a4aadb9f0",
  })
  @ApiResponse({
    status: 200,
    description: "Quiz récupéré avec succès",
  })
  @ApiResponse({ status: 404, description: "Quiz non trouvé ou non actif" })
  async getQuizByAccessToken(
    @Param("accessToken") accessToken: string,
  ) {
    const result = await this.quizFacade.getQuizByAccessToken({
      accessToken,
    });

    return this.success(result);
  }
}

@ApiTags("Public Quizzes")
@Controller("v1/quizzes")
export class QuizPublicSubmitController extends BaseController {
  constructor(private readonly quizFacade: QuizFacade) {
    super();
  }

  @Get(":id/response-status")
  @ApiOperation({
    summary: "Vérifier si un quiz a déjà été répondu (public)",
    description: "Vérifie si l'utilisateur a déjà répondu à ce quiz. Endpoint public, pas d'authentification requise.",
  })
  @ApiParam({
    name: "id",
    description: "ID du quiz",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Statut de réponse récupéré avec succès",
  })
  @ApiResponse({ status: 404, description: "Quiz non trouvé" })
  async checkQuizResponseStatus(
    @Param("id") quizId: string,
    @Req() request: any,
  ) {
    const ipAddress = request.ip || request.headers["x-forwarded-for"] || request.connection.remoteAddress;
    const userAgent = request.headers["user-agent"] || null;

    const result = await this.quizFacade.checkQuizResponseStatus({
      quizId,
      ipAddress: ipAddress || null,
      userAgent,
    });

    return this.success(result);
  }

  @Post(":id/submit")
  @ApiOperation({
    summary: "Soumettre une réponse à un quiz (public)",
    description: "Soumet les réponses d'un étudiant à un quiz. Endpoint public, pas d'authentification requise.",
  })
  @ApiParam({
    name: "id",
    description: "ID du quiz",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 201,
    description: "Réponse soumise avec succès",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 404, description: "Quiz non trouvé" })
  async submitQuizResponse(
    @Param("id") quizId: string,
    @Body() body: { responses: Array<{ questionId: string; valueText?: string; valueNumber?: number; valueJson?: any }>; studentToken?: string | null },
    @Req() request: any,
  ) {
    const ipAddress = request.ip || request.headers["x-forwarded-for"] || request.connection.remoteAddress;
    const userAgent = request.headers["user-agent"] || null;

    const result = await this.quizFacade.submitQuizResponse({
      quizId,
      responses: body.responses,
      ipAddress: ipAddress || null,
      userAgent,
      completionTimeSeconds: null,
      studentToken: body.studentToken || null,
    });

    return this.success(result);
  }
}

