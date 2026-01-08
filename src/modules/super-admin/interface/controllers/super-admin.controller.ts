import {
  Controller,
  Get,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { BaseController, AuthGuard } from "src/core";
import { SuperAdminFacade } from "../../application/facades/super-admin.facade";
import { SuperAdminGuard } from "../../../contact/guards/super-admin.guard";
import {
  UpdatePlanUseCase,
  UpdatePlanInput,
} from "../../application/use-cases/UpdatePlan.use-case";

@ApiTags("Super Admin")
@Controller("v1/super-admin")
@ApiBearerAuth()
@UseGuards(AuthGuard, SuperAdminGuard)
export class SuperAdminController extends BaseController {
  constructor(
    private readonly superAdminFacade: SuperAdminFacade,
    private readonly updatePlanUseCase: UpdatePlanUseCase,
  ) {
    super();
  }

  @Get("dashboard")
  @ApiOperation({
    summary: "Tableau de bord Super Admin",
    description: "Récupère les statistiques globales de la plateforme.",
  })
  @ApiResponse({
    status: 200,
    description: "Statistiques du tableau de bord",
  })
  async getDashboardStats() {
    const stats = await this.superAdminFacade.getDashboardStats();
    return this.success(stats);
  }

  @Get("organizations")
  @ApiOperation({
    summary: "Lister les organisations",
    description:
      "Récupère la liste de toutes les organisations avec pagination.",
  })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiResponse({
    status: 200,
    description: "Liste des organisations",
  })
  async getOrganizations(
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
    @Query("search") search?: string,
  ) {
    const result = await this.superAdminFacade.getOrganizations({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      search,
    });
    return this.success(result);
  }

  @Get("organizations/:id")
  @ApiOperation({
    summary: "Détails d'une organisation",
    description: "Récupère les détails d'une organisation avec ses membres.",
  })
  @ApiResponse({
    status: 200,
    description: "Détails de l'organisation",
  })
  @ApiResponse({ status: 404, description: "Organisation non trouvée" })
  async getOrganizationDetails(@Param("id") id: string) {
    const result = await this.superAdminFacade.getOrganizationDetails(id);
    return this.success(result);
  }

  @Get("plans")
  @ApiOperation({
    summary: "Lister les plans d'abonnement",
    description: "Récupère la liste de tous les plans d'abonnement.",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des plans",
  })
  async getPlans() {
    const plans = await this.superAdminFacade.getPlans();
    return this.success(plans);
  }

  @Patch("plans/:id")
  @ApiOperation({
    summary: "Mettre à jour un plan d'abonnement",
    description: "Met à jour les propriétés d'un plan d'abonnement.",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        displayPrice: { type: "string" },
        priceSubtext: { type: "string", nullable: true },
        basePriceCents: { type: "number" },
        trialPeriodDays: { type: "number" },
        isActive: { type: "boolean" },
        displayOrder: { type: "number" },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Plan mis à jour",
  })
  async updatePlan(
    @Param("id") id: string,
    @Body() body: Partial<UpdatePlanInput>,
  ) {
    const result = await this.updatePlanUseCase.execute({
      planId: id,
      ...body,
    });
    return this.success(result);
  }

  @Get("subscriptions")
  @ApiOperation({
    summary: "Lister les abonnements",
    description: "Récupère la liste de tous les abonnements actifs.",
  })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiResponse({
    status: 200,
    description: "Liste des abonnements",
  })
  async getSubscriptions(
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
    @Query("status") status?: string,
  ) {
    const result = await this.superAdminFacade.getSubscriptions({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      status,
    });
    return this.success(result);
  }
}
