import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsUUID,
  ArrayMinSize,
} from "class-validator";

export class CreateReportDto {
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
    description: "Contenu du rapport hebdomadaire généré",
    example:
      "Ce rapport hebdomadaire présente les performances des étudiants...",
  })
  @IsString({ message: "Report content must be a string" })
  @IsNotEmpty({ message: "Report content is required" })
  reportContent: string;

  @ApiProperty({
    description: "Liste des IDs des matières concernées par le rapport",
    example: [
      "123e4567-e89b-12d3-a456-426614174001",
      "123e4567-e89b-12d3-a456-426614174002",
    ],
    type: [String],
  })
  @IsArray({ message: "Subject IDs must be an array" })
  @ArrayMinSize(1, { message: "At least one subject ID is required" })
  @IsUUID(4, { each: true, message: "Each subject ID must be a valid UUID" })
  subjectIds: string[];
}
