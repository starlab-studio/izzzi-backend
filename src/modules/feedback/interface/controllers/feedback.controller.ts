import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  Req,
  Headers,
} from "@nestjs/common";
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
import { QuizFacade } from "src/modules/quiz/application/facades/quiz.facade";
import { CreateAlertDto } from "../dto/alert.dto";

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@ApiTags("Feedback")
@Controller("v1/feedback")
export class FeedbackController extends BaseController {
  constructor(
    private readonly feedbackFacade: FeedbackFacade,
    private readonly quizFacade: QuizFacade
  ) {
    super();
  }

  @Post("alerts")
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: "Recevoir des alertes depuis Langchain",
    description:
      "Endpoint appelé par le service Langchain pour envoyer les alertes générées. Déclenche l'envoi d'email et de notifications push.",
  })
  @ApiResponse({
    status: 200,
    description: "Alertes reçues et notifications envoyées avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  async createAlert(@Body() body: CreateAlertDto) {
    const result = await this.feedbackFacade.createAlert({
      organizationId: body.organizationId,
      organizationName: body.organizationName,
      subjectId: body.subjectId,
      subjectName: body.subjectName,
      alerts: body.alerts,
    });

    return this.success(result);
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

  @Get("subjects/:subjectId")
  @ApiOperation({
    summary: "Récupérer un sujet de feedback par ID",
    description:
      "Récupère les détails d'un sujet de feedback spécifique. Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Sujet récupéré avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Sujet non trouvé" })
  async getFeedbackSubjectById(
    @Param("subjectId") subjectId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any
  ) {
    const organizationId = request.organizationId;
    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.feedbackFacade.getFeedbackSubjectById({
      organizationId,
      userId: user.userId,
      subjectId,
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

  @Get("subjects/:subjectId/summary")
  @ApiOperation({
    summary: "Récupérer le résumé IA des feedbacks",
    description:
      "Récupère le résumé généré par IA des feedbacks pour une matière. Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Résumé récupéré avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async getFeedbackSummary(
    @Param("subjectId") subjectId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
    @Headers("authorization") authHeader?: string
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    let jwtToken: string | undefined;

    if (authHeader) {
      const [type, token] = authHeader.split(" ");
      jwtToken = type === "Bearer" ? token : undefined;
    }

    if (!jwtToken && request.cookies?.["access_token"]) {
      jwtToken = request.cookies["access_token"];
    }

    if (!jwtToken) {
      throw new Error("JWT token is missing from request headers or cookies");
    }

    const result = await this.feedbackFacade.getFeedbackSummary({
      organizationId,
      userId: user.userId,
      subjectId,
      jwtToken,
    });

    return this.success(result);
  }

  @Post("subjects/:subjectId/summary/generate")
  @ApiOperation({
    summary: "Générer et sauvegarder le résumé IA des feedbacks",
    description:
      "Génère un nouveau résumé IA des feedbacks pour une matière et le sauvegarde en base de données. Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Résumé généré et sauvegardé avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async generateSubjectSummary(
    @Param("subjectId") subjectId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
    @Query("periodDays") periodDays?: number,
    @Query("formType") formTypeParam?: string,
    @Headers("authorization") authHeader?: string
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    let formType: "during_course" | "after_course";
    if (formTypeParam === "during") {
      formType = "during_course";
    } else if (formTypeParam === "end") {
      formType = "after_course";
    } else {
      throw new Error(
        `Invalid formType: ${formTypeParam}. Must be "during" or "end"`
      );
    }

    let jwtToken: string | undefined;

    if (authHeader) {
      const [type, token] = authHeader.split(" ");
      jwtToken = type === "Bearer" ? token : undefined;
    }

    if (!jwtToken && request.cookies?.["access_token"]) {
      jwtToken = request.cookies["access_token"];
    }

    if (!jwtToken) {
      throw new Error("JWT token is missing from request headers or cookies");
    }

    const result = await this.feedbackFacade.generateAndSaveSubjectSummary({
      organizationId,
      userId: user.userId,
      subjectId,
      formType,
      periodDays: periodDays ? Number(periodDays) : 30,
      jwtToken,
    });

    return this.success(result);
  }

  @Get("subjects/:subjectId/alerts")
  @ApiOperation({
    summary: "Récupérer les alertes IA",
    description:
      "Récupère les alertes générées par IA pour une matière. Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Alertes récupérées avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async getSubjectAlerts(
    @Param("subjectId") subjectId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
    @Headers("authorization") authHeader?: string
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    let jwtToken: string | undefined;

    if (authHeader) {
      const [type, token] = authHeader.split(" ");
      jwtToken = type === "Bearer" ? token : undefined;
    }

    if (!jwtToken && request.cookies?.["access_token"]) {
      jwtToken = request.cookies["access_token"];
    }

    if (!jwtToken) {
      throw new Error("JWT token is missing from request headers or cookies");
    }

    const result = await this.feedbackFacade.getSubjectAlerts({
      organizationId,
      userId: user.userId,
      subjectId,
      jwtToken,
    });

    return this.success(result);
  }

  @Post("subjects/:subjectId/alerts/:alertId/comment")
  @ApiOperation({
    summary: "Commenter une alerte",
    description:
      "Ajoute un commentaire à une alerte. Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Commentaire ajouté avec succès",
  })
  async commentOnAlert(
    @Param("subjectId") subjectId: string,
    @Param("alertId") alertId: string,
    @Body() body: { comment: string },
    @CurrentUser() user: JWTPayload,
    @Req() request: any
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.feedbackFacade.commentOnAlert({
      organizationId,
      userId: user.userId,
      subjectId,
      alertId,
      comment: body.comment,
    });

    return this.success(result);
  }

  @Post("subjects/:subjectId/alerts/:alertId/send-message")
  @ApiOperation({
    summary: "Envoyer un message pour une alerte",
    description:
      "Envoie un message aux étudiants concernés par une alerte. Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Message envoyé avec succès",
  })
  async sendMessageForAlert(
    @Param("subjectId") subjectId: string,
    @Param("alertId") alertId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.feedbackFacade.sendMessageForAlert({
      organizationId,
      userId: user.userId,
      subjectId,
      alertId,
    });

    return this.success(result);
  }

  @Patch("subjects/:subjectId/alerts/:alertId/mark-processed")
  @ApiOperation({
    summary: "Marquer une alerte comme traitée",
    description:
      "Marque une alerte comme traitée ou non traitée. Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Statut de l'alerte mis à jour avec succès",
  })
  async markAlertAsProcessed(
    @Param("subjectId") subjectId: string,
    @Param("alertId") alertId: string,
    @Body() body: { processed: boolean },
    @CurrentUser() user: JWTPayload,
    @Req() request: any
  ) {
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.feedbackFacade.markAlertAsProcessed({
      organizationId,
      userId: user.userId,
      subjectId,
      alertId,
      processed: body.processed,
    });

    return this.success(result);
  }

  @Post("subjects/:subjectId/remind")
  @ApiOperation({
    summary: "Envoyer des rappels pour tous les quiz d'une matière",
    description:
      "Envoie des rappels pour tous les quiz actifs d'une matière. Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Rappels envoyés avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async sendReminderBySubject(
    @Param("subjectId") subjectId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any
  ) {
    const organizationId = request.organizationId;
    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.feedbackFacade.sendReminderBySubject({
      organizationId,
      userId: user.userId,
      subjectId,
    });

    return this.success(result);
  }

  @Post("subjects/:subjectId/moments/:momentId/remind")
  @ApiOperation({
    summary: "Envoyer un rappel pour un quiz spécifique",
    description:
      "Envoie un rappel pour un quiz (moment) spécifique. Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Rappel envoyé avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async sendReminderForMoment(
    @Param("subjectId") subjectId: string,
    @Param("momentId") momentId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any
  ) {
    const organizationId = request.organizationId;
    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.quizFacade.remindQuizToStudents({
      quizId: momentId,
      organizationId,
      userId: user.userId,
    });

    return this.success(result);
  }

  @Get("subjects/:subjectId/moments/:momentId/qr-code")
  @ApiOperation({
    summary: "Récupérer le QR code d'un quiz",
    description:
      "Récupère le QR code d'un quiz (moment) spécifique. Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "QR code récupéré avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async getQRCodeForMoment(
    @Param("subjectId") subjectId: string,
    @Param("momentId") momentId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any
  ) {
    const organizationId = request.organizationId;
    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.quizFacade.getQuizLink({
      quizId: momentId,
      organizationId,
      userId: user.userId,
    });

    return this.success({
      qrCodeUrl: result.qrCodeUrl,
    });
  }

  @Get("subjects/:subjectId/moments/:momentId/form-link")
  @ApiOperation({
    summary: "Récupérer le lien du formulaire d'un quiz",
    description:
      "Récupère le lien public du formulaire d'un quiz (moment) spécifique. Nécessite le rôle LEARNING_MANAGER ou ADMIN.",
  })
  @Roles(UserRole.LEARNING_MANAGER, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Lien du formulaire récupéré avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async getFormLinkForMoment(
    @Param("subjectId") subjectId: string,
    @Param("momentId") momentId: string,
    @CurrentUser() user: JWTPayload,
    @Req() request: any
  ) {
    const organizationId = request.organizationId;
    if (!organizationId) {
      throw new Error("Organization context required");
    }

    const result = await this.quizFacade.getQuizLink({
      quizId: momentId,
      organizationId,
      userId: user.userId,
    });

    return this.success({
      link: result.publicUrl,
    });
  }
}
