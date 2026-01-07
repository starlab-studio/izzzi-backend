import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import {
  BaseController,
  AuthGuard,
  RolesGuard,
  Roles,
  UserRole,
  CurrentUser,
  type JWTPayload,
} from "src/core";
import { SubscriptionFacade } from "../../application/facades/subscription.facade";
import {
  PricingPlanResponseDto,
  PricingTierResponseDto,
  GetPricingTiersQueryDto,
  CalculatePriceQueryDto,
  CalculatePriceResponseDto,
  CreateSubscriptionDto,
  CreateSubscriptionResponseDto,
  UpdateQuantityDto,
  UpdateQuantityResponseDto,
  CancelSubscriptionDto,
  CancelSubscriptionResponseDto,
  GetSubscriptionResponseDto,
  SyncPlansWithStripeResponseDto,
  PaymentConfirmationResponseDto,
  BillingPortalResponseDto,
} from "../dto/pricing.dto";

@ApiTags("subscription")
@Controller("v1/subscription")
export class SubscriptionController extends BaseController {
  constructor(private readonly subscriptionFacade: SubscriptionFacade) {
    super();
  }

  @Get("pricing-plans")
  @ApiOperation({ summary: "Récupérer tous les plans de tarification actifs" })
  @ApiResponse({
    status: 200,
    description: "Liste des plans de tarification",
    type: [PricingPlanResponseDto],
  })
  async getPricingPlans() {
    const plans = await this.subscriptionFacade.getPricingPlans();
    return this.success(plans);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Get(":organizationId/current")
  @ApiOperation({
    summary: "Récupérer la subscription active d'une organisation",
    description:
      "Récupère les détails complets de la subscription active, incluant le plan, les features et le pricing",
  })
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    type: String,
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Détails de la subscription active",
    type: GetSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Aucune subscription active trouvée",
  })
  async getCurrentSubscription(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Param("organizationId") organizationId: string
  ) {
    const result = await this.subscriptionFacade.getSubscription({
      organizationId,
      userId: authenticatedUser.userId,
    });
    if (!result) {
      return this.success(null);
    }
    return this.success(result);
  }

  @Get("pricing-tiers/:planId")
  @ApiOperation({
    summary: "Récupérer les paliers de tarification pour un plan",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des paliers de tarification",
    type: [PricingTierResponseDto],
  })
  async getPricingTiers(
    @Param("planId") planId: string,
    @Query() query: GetPricingTiersQueryDto
  ) {
    const tiers = await this.subscriptionFacade.getPricingTiers(
      planId,
      query.billingPeriod
    );
    return this.success(tiers);
  }

  @Get("calculate-price")
  @ApiOperation({
    summary: "Calculer le prix d'une subscription selon le nombre de classes",
  })
  @ApiResponse({
    status: 200,
    description: "Prix calculé pour la subscription",
    type: CalculatePriceResponseDto,
  })
  async calculatePrice(@Query() query: CalculatePriceQueryDto) {
    const result = await this.subscriptionFacade.calculatePrice({
      planId: query.planId,
      classCount: query.classCount,
      billingPeriod: query.billingPeriod || "monthly",
    });
    return this.success(result);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  // @Roles(UserRole.SUPER_ADMIN)
  @Post("sync-stripe")
  @ApiOperation({
    summary: "Synchroniser tous les plans et tiers avec Stripe",
    description:
      "Crée ou met à jour les produits et prix Stripe pour tous les plans actifs. Seuls les administrateurs peuvent exécuter cette action.",
  })
  @ApiResponse({
    status: 200,
    description: "Synchronisation réussie",
    type: SyncPlansWithStripeResponseDto,
  })
  async syncWithStripe(@CurrentUser() authenticatedUser: JWTPayload) {
    const result = await this.subscriptionFacade.syncPlansWithStripe();
    return this.success(result);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(":organizationId/payment-confirmation")
  @ApiOperation({
    summary: "Récupérer les détails de confirmation de paiement",
    description:
      "Récupère les détails de la dernière facture et du moyen de paiement pour une organisation. Seuls les administrateurs peuvent accéder à ces informations.",
  })
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    type: String,
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Détails de confirmation de paiement",
    type: PaymentConfirmationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Aucune subscription active ou facture trouvée",
  })
  async getPaymentConfirmation(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Param("organizationId") organizationId: string
  ) {
    const result = await this.subscriptionFacade.getPaymentConfirmation({
      organizationId,
      userId: authenticatedUser.userId,
    });
    return this.success(result);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(":organizationId/billing-access")
  @ApiOperation({
    summary: "Vérifier l'accès au portail de facturation",
    description:
      "Vérifie si l'organisation a accès au portail de facturation (a un stripeCustomerId). Seuls les administrateurs peuvent accéder à cette information.",
  })
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    type: String,
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Statut d'accès au portail de facturation",
    schema: {
      type: "object",
      properties: {
        hasAccess: {
          type: "boolean",
          description:
            "Indique si l'organisation a accès au portail de facturation",
        },
      },
    },
  })
  async checkBillingAccess(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Param("organizationId") organizationId: string
  ) {
    const result = await this.subscriptionFacade.checkBillingAccess({
      organizationId,
    });
    return this.success(result);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(":organizationId/billing-portal")
  @ApiOperation({
    summary: "Générer un lien vers le portail de facturation Stripe",
    description:
      "Génère une session temporaire pour accéder au portail de gestion de facturation Stripe. Seuls les administrateurs peuvent accéder à ce lien.",
  })
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    type: String,
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "URL du portail de facturation",
    type: BillingPortalResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Aucune subscription trouvée pour cette organisation",
  })
  async getBillingPortalLink(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Param("organizationId") organizationId: string,
    @Query("returnUrl") returnUrl?: string
  ) {
    const result = await this.subscriptionFacade.getBillingPortalLink({
      organizationId,
      userId: authenticatedUser.userId,
      returnUrl,
    });
    return this.success(result);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(":organizationId")
  @ApiOperation({
    summary: "Créer une nouvelle subscription pour une organisation",
    description:
      "Seuls les administrateurs de l'organisation peuvent créer une subscription",
  })
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    type: String,
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiResponse({
    status: 201,
    description: "Subscription créée avec succès",
    type: CreateSubscriptionResponseDto,
  })
  async createSubscription(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Param("organizationId") organizationId: string,
    @Body() body: CreateSubscriptionDto
  ) {
    const result = await this.subscriptionFacade.createSubscription({
      userId: authenticatedUser.userId,
      organizationId,
      planId: body.planId,
      quantity: body.quantity,
      billingPeriod: body.billingPeriod || "monthly",
    });
    return this.success(result);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(":organizationId/:subscriptionId/quantity")
  @ApiOperation({
    summary: "Modifier le nombre de classes d'une subscription",
    description:
      "Seuls les administrateurs de l'organisation peuvent modifier la subscription. Upgrade = effet immédiat avec proration. Downgrade = effet en fin de période.",
  })
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    type: String,
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiParam({
    name: "subscriptionId",
    description: "ID de la subscription",
    type: String,
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: UpdateQuantityDto })
  @ApiResponse({
    status: 200,
    description: "Quantité mise à jour avec succès",
    type: UpdateQuantityResponseDto,
  })
  async updateQuantity(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Param("organizationId") organizationId: string,
    @Param("subscriptionId") subscriptionId: string,
    @Body() body: UpdateQuantityDto
  ) {
    const result = await this.subscriptionFacade.updateQuantity({
      subscriptionId,
      newQuantity: body.quantity,
      organizationId,
      userId: authenticatedUser.userId,
    });
    return this.success(result);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(":organizationId/:subscriptionId/cancel")
  @ApiOperation({
    summary: "Annuler une subscription",
    description:
      "Seuls les administrateurs de l'organisation peuvent annuler la subscription. Annulation immédiate ou planifiée à la fin de période.",
  })
  @ApiParam({
    name: "organizationId",
    description: "ID de l'organisation",
    type: String,
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiParam({
    name: "subscriptionId",
    description: "ID de la subscription",
    type: String,
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: CancelSubscriptionDto })
  @ApiResponse({
    status: 200,
    description: "Subscription annulée avec succès",
    type: CancelSubscriptionResponseDto,
  })
  async cancelSubscription(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Param("organizationId") organizationId: string,
    @Param("subscriptionId") subscriptionId: string,
    @Body() body: CancelSubscriptionDto
  ) {
    const result = await this.subscriptionFacade.cancelSubscription({
      subscriptionId,
      organizationId,
      userId: authenticatedUser.userId,
      immediate: body.immediate,
      reason: body.reason,
    });
    return this.success(result);
  }
}
