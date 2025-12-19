import { IsEnum, IsOptional, IsString } from "class-validator";
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
