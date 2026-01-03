import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsUUID,
  ArrayMinSize,
  ValidateNested,
  IsEnum,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";

class AlertItemDto {
  @ApiProperty({
    description: "ID unique de l'alerte",
    example: "alert_123e4567-e89b-12d3-a456-426614174000_0",
  })
  @IsString({ message: "Alert ID must be a string" })
  @IsNotEmpty({ message: "Alert ID is required" })
  id: string;

  @ApiProperty({
    description: "Type d'alerte",
    example: "negative",
    enum: ["negative", "alert"],
  })
  @IsEnum(["negative", "alert"], {
    message: "Alert type must be 'negative' or 'alert'",
  })
  @IsNotEmpty({ message: "Alert type is required" })
  type: "negative" | "alert";

  @ApiProperty({
    description: "Numéro de l'alerte",
    example: "Alerte 1/3",
  })
  @IsString({ message: "Alert number must be a string" })
  @IsNotEmpty({ message: "Alert number is required" })
  number: string;

  @ApiProperty({
    description: "Contenu de l'alerte",
    example: "Sentiment négatif détecté pour cette matière...",
  })
  @IsString({ message: "Alert content must be a string" })
  @IsNotEmpty({ message: "Alert content is required" })
  content: string;

  @ApiProperty({
    description: "Titre de l'alerte",
    example: "Sentiment négatif détecté",
  })
  @IsString({ message: "Alert title must be a string" })
  @IsNotEmpty({ message: "Alert title is required" })
  title: string;

  @ApiProperty({
    description: "Priorité de l'alerte",
    example: "high",
    enum: ["low", "medium", "high", "urgent"],
  })
  @IsEnum(["low", "medium", "high", "urgent"], {
    message: "Alert priority must be one of: low, medium, high, urgent",
  })
  @IsNotEmpty({ message: "Alert priority is required" })
  priority: "low" | "medium" | "high" | "urgent";

  @ApiProperty({
    description: "Timestamp de génération de l'alerte",
    example: "2024-01-15T10:30:00.000Z",
  })
  @IsString({ message: "Alert timestamp must be a string" })
  @IsNotEmpty({ message: "Alert timestamp is required" })
  timestamp: string;

  @ApiProperty({
    description: "Preuves/évidences de l'alerte",
    example: ["Réponse 1", "Réponse 2"],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: "Alert evidence must be an array" })
  @IsString({ each: true, message: "Each evidence item must be a string" })
  evidence?: string[];
}

export class CreateAlertDto {
  @ApiProperty({
    description: "ID de l'organisation",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsString({ message: "Organization ID must be a string" })
  @IsNotEmpty({ message: "Organization ID is required" })
  @IsUUID(4, { message: "Organization ID must be a valid UUID" })
  organizationId: string;

  @ApiProperty({
    description: "Nom de l'organisation",
    example: "École Primaire de Paris",
  })
  @IsString({ message: "Organization name must be a string" })
  @IsNotEmpty({ message: "Organization name is required" })
  organizationName: string;

  @ApiProperty({
    description: "ID de la matière concernée",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsString({ message: "Subject ID must be a string" })
  @IsNotEmpty({ message: "Subject ID is required" })
  @IsUUID(4, { message: "Subject ID must be a valid UUID" })
  subjectId: string;

  @ApiProperty({
    description: "Nom de la matière",
    example: "Mathématiques",
  })
  @IsString({ message: "Subject name must be a string" })
  @IsNotEmpty({ message: "Subject name is required" })
  subjectName: string;

  @ApiProperty({
    description: "Liste des alertes générées",
    type: [AlertItemDto],
  })
  @IsArray({ message: "Alerts must be an array" })
  @ArrayMinSize(1, { message: "At least one alert is required" })
  @ValidateNested({ each: true })
  @Type(() => AlertItemDto)
  alerts: AlertItemDto[];
}
