import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { BaseController } from "src/core";
import { SubscriptionFacade } from "../../application/facades/subscription.facade";
import {
  PricingPlanResponseDto,
  PricingTierResponseDto,
  GetPricingTiersQueryDto,
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
}
