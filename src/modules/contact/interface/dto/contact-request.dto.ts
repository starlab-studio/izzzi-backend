import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsEnum,
} from "class-validator";
import { ContactRequestStatus } from "../../domain/types";

export class CreateContactRequestDto {
  @ApiProperty({
    description: "Prénom du demandeur",
    example: "Jean",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: "Nom du demandeur",
    example: "Dupont",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: "Email du demandeur",
    example: "jean.dupont@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: "Numéro de téléphone",
    example: "+33612345678",
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: "Nom de l'organisation",
    example: "École Polytechnique",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  organizationName?: string;

  @ApiPropertyOptional({
    description: "Nombre de classes",
    example: 25,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  numberOfClasses?: number;

  @ApiProperty({
    description: "Message de la demande",
    example: "Nous aimerions avoir plus d'informations sur votre offre entreprise.",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}

export class UpdateContactRequestDto {
  @ApiPropertyOptional({
    description: "Statut de la demande",
    enum: ContactRequestStatus,
  })
  @IsOptional()
  @IsEnum(ContactRequestStatus)
  status?: ContactRequestStatus;

  @ApiPropertyOptional({
    description: "Notes internes",
    example: "Client contacté par téléphone le 03/01/2026",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ContactRequestQueryDto {
  @ApiPropertyOptional({
    description: "Filtrer par statut",
    enum: ContactRequestStatus,
  })
  @IsOptional()
  @IsEnum(ContactRequestStatus)
  status?: ContactRequestStatus;

  @ApiPropertyOptional({
    description: "Nombre de résultats",
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: "Offset pour la pagination",
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

