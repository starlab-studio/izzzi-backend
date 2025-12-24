import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class GetPricingTiersQueryDto {
  @ApiProperty({
    enum: ["monthly", "annual"],
    description: "Période de facturation",
  })
  @IsEnum(["monthly", "annual"])
  billingPeriod: "monthly" | "annual";
}

export class PricingTierResponseDto {
  @ApiProperty()
  minClasses: number;

  @ApiProperty()
  maxClasses: number;

  @ApiProperty()
  pricePerClass: number;
}

export class PricingFeatureDto {
  @ApiProperty()
  text: string;

  @ApiPropertyOptional()
  subtext?: string;
}

export class AdditionalSectionDto {
  @ApiProperty()
  title: string;

  @ApiProperty({ type: [PricingFeatureDto] })
  features: PricingFeatureDto[];
}

export class PricingPlanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  badge: string;

  @ApiProperty()
  price: string;

  @ApiProperty()
  priceSubtext: string;

  @ApiProperty()
  ctaText: string;

  @ApiProperty({ type: [PricingFeatureDto] })
  features: PricingFeatureDto[];

  @ApiPropertyOptional({ type: AdditionalSectionDto })
  additionalSection?: AdditionalSectionDto;

  @ApiProperty()
  detailsButtonText: string;

  @ApiProperty({ enum: ["default", "premium"] })
  variant: "default" | "premium";
}

export class CalculatePriceQueryDto {
  @ApiProperty({
    description: "ID du plan de subscription (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsString()
  planId: string;

  @ApiProperty({
    description: "Nombre de classes",
    minimum: 1,
    maximum: 20,
    example: 7,
  })
  @Type(() => Number)
  @IsInt({ message: "classCount must be an integer number" })
  @Min(1, { message: "classCount must not be less than 1" })
  @Max(20, { message: "classCount must not be greater than 20" })
  classCount: number;

  @ApiPropertyOptional({
    enum: ["monthly", "annual"],
    description: "Période de facturation (défaut: monthly)",
    default: "monthly",
  })
  @IsEnum(["monthly", "annual"], {
    message: "billingPeriod must be one of: monthly, annual",
  })
  @IsOptional()
  billingPeriod?: "monthly" | "annual";
}

export class CalculatePriceResponseDto {
  @ApiProperty()
  planId: string;

  @ApiProperty()
  planName: string;

  @ApiProperty()
  classCount: number;

  @ApiProperty({
    description: "Prix par classe en centimes",
    example: 2200,
  })
  pricePerClassCents: number;

  @ApiProperty({
    description: "Prix total en centimes",
    example: 15400,
  })
  totalPriceCents: number;

  @ApiProperty({
    description: "Prix total formaté",
    example: "154€",
  })
  totalPriceFormatted: string;

  @ApiProperty({
    description: "Prix par classe formaté",
    example: "22€",
  })
  pricePerClassFormatted: string;

  @ApiProperty({ enum: ["monthly", "annual"] })
  billingPeriod: "monthly" | "annual";

  @ApiProperty({
    description: "Palier de tarification utilisé",
    type: "object",
    properties: {
      minClasses: { type: "number" },
      maxClasses: { type: "number" },
    },
  })
  tier: {
    minClasses: number;
    maxClasses: number;
  };
}

export class CreateSubscriptionDto {
  @ApiProperty({
    description: "ID du plan de subscription",
    example: "10000000-0000-0000-0000-000000000002",
  })
  @IsString()
  planId: string;

  @ApiProperty({
    description: "Nombre de classes",
    minimum: 1,
    maximum: 20,
    example: 7,
  })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;

  @ApiPropertyOptional({
    enum: ["monthly", "annual"],
    description: "Période de facturation (défaut: monthly)",
    default: "monthly",
  })
  @IsEnum(["monthly", "annual"])
  @IsOptional()
  billingPeriod?: "monthly" | "annual";
}

export class SubscriptionDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  planId: string;

  @ApiProperty()
  planName: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  totalPriceCents: number;

  @ApiProperty()
  currentPeriodStart: Date;

  @ApiProperty()
  currentPeriodEnd: Date;

  @ApiProperty({ nullable: true })
  trialEnd: Date | null;
}

export class CreateSubscriptionResponseDto {
  @ApiProperty({
    description: "Détails de la subscription créée",
    type: SubscriptionDetailsDto,
  })
  subscription: SubscriptionDetailsDto;

  @ApiProperty({
    description: "Indique si un paiement est requis",
    example: true,
  })
  requiresPayment: boolean;

  @ApiPropertyOptional({
    description: "Client secret Stripe (sera implémenté plus tard)",
  })
  stripeClientSecret?: string;

  @ApiPropertyOptional({
    description: "URL de checkout Stripe (sera implémenté plus tard)",
  })
  stripeCheckoutUrl?: string;
}

export class SyncPlansWithStripeResponseDto {
  @ApiProperty({
    description: "Nombre de plans synchronisés",
    example: 1,
  })
  syncedPlans: number;

  @ApiProperty({
    description: "Nombre de tiers synchronisés",
    example: 8,
  })
  syncedTiers: number;

  @ApiProperty({
    description: "Détails de la synchronisation par plan",
    type: "array",
    items: {
      type: "object",
      properties: {
        planId: { type: "string" },
        planName: { type: "string" },
        productId: { type: "string" },
        tiersSynced: { type: "number" },
      },
    },
  })
  details: Array<{
    planId: string;
    planName: string;
    productId: string;
    tiersSynced: number;
  }>;
}

export class UpdateQuantityDto {
  @ApiProperty({
    description: "Nouveau nombre de classes",
    minimum: 1,
    maximum: 20,
    example: 10,
  })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;
}

export class UpdateQuantityResponseDto {
  @ApiProperty({
    description: "Détails de la subscription mise à jour",
    type: SubscriptionDetailsDto,
  })
  subscription: SubscriptionDetailsDto;

  @ApiProperty()
  previousQuantity: number;

  @ApiProperty()
  newQuantity: number;

  @ApiProperty()
  previousPriceCents: number;

  @ApiProperty()
  newPriceCents: number;

  @ApiProperty({
    description: "Différence de prix (positif = upgrade, négatif = downgrade)",
  })
  priceDifferenceCents: number;

  @ApiProperty()
  isUpgrade: boolean;

  @ApiProperty()
  effectiveDate: Date;

  @ApiProperty()
  prorationApplied: boolean;

  @ApiProperty()
  requiresPayment: boolean;

  @ApiPropertyOptional()
  amountDueCents?: number;
}

export class CancelSubscriptionDto {
  @ApiProperty({
    description: "Annulation immédiate (true) ou à la fin de période (false)",
    example: false,
  })
  @IsBoolean()
  immediate: boolean;

  @ApiPropertyOptional({
    description: "Raison de l'annulation",
    example: "Trop cher",
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CancelSubscriptionResponseDto {
  @ApiProperty({
    description: "Détails de la subscription annulée",
    type: SubscriptionDetailsDto,
  })
  subscription: SubscriptionDetailsDto;

  @ApiProperty()
  canceledAt: Date;

  @ApiProperty({
    description: "Date d'effet de l'annulation",
  })
  effectiveDate: Date;

  @ApiProperty()
  wasImmediate: boolean;

  @ApiProperty({
    description: "Montant du remboursement en centimes (0 par défaut)",
    example: 0,
  })
  refundAmountCents: number;
}

export class SubscriptionDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  currentPeriodStart: Date;

  @ApiProperty()
  currentPeriodEnd: Date;

  @ApiProperty()
  cancelAtPeriodEnd: boolean;

  @ApiProperty({ nullable: true })
  trialEnd: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class PlanInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ["default", "premium"] })
  variant: "default" | "premium";

  @ApiProperty()
  displayPrice: string;
}

export class PricingInfoDto {
  @ApiProperty()
  pricePerClassCents: number;

  @ApiProperty()
  totalPriceCents: number;

  @ApiProperty()
  pricePerClassFormatted: string;

  @ApiProperty()
  totalPriceFormatted: string;
}

export class FeatureDto {
  @ApiProperty()
  featureKey: string;

  @ApiProperty()
  featureText: string;

  @ApiProperty({ nullable: true })
  featureSubtext: string | null;

  @ApiProperty()
  isComingSoon: boolean;
}

export class UsageInfoDto {
  @ApiProperty()
  classesUsed: number;

  @ApiProperty()
  classesRemaining: number;
}

export class GetSubscriptionResponseDto {
  @ApiProperty({
    description: "Détails de la subscription",
    type: SubscriptionDetailDto,
  })
  subscription: SubscriptionDetailDto;

  @ApiProperty({
    description: "Informations sur le plan",
    type: PlanInfoDto,
  })
  plan: PlanInfoDto;

  @ApiProperty({
    description: "Informations de tarification",
    type: PricingInfoDto,
  })
  pricing: PricingInfoDto;

  @ApiProperty({
    description: "Liste des features du plan",
    type: [FeatureDto],
  })
  features: FeatureDto[];

  @ApiPropertyOptional({
    description: "Informations d'utilisation (optionnel)",
    type: UsageInfoDto,
  })
  usage?: UsageInfoDto;
}
