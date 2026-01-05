import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsUUID,
  IsUrl,
  IsNotEmpty,
} from "class-validator";

export class UpdateProfileDto {
  @ApiProperty({
    description: "Prénom de l'utilisateur",
    example: "John",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Le prénom doit contenir au moins 2 caractères" })
  @MaxLength(50, { message: "Le prénom doit contenir au plus 50 caractères" })
  @Matches(/^[A-Za-zÀ-ÖØ-öø-ÿ'-\s]+$/, {
    message: "Le prénom ne peut contenir que des lettres",
  })
  firstname?: string;

  @ApiProperty({
    description: "Nom de l'utilisateur",
    example: "Doe",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Le nom doit contenir au moins 2 caractères" })
  @MaxLength(50, { message: "Le nom doit contenir au plus 50 caractères" })
  @Matches(/^[A-Za-zÀ-ÖØ-öø-ÿ'-\s]+$/, {
    message: "Le nom ne peut contenir que des lettres",
  })
  lastname?: string;

  @ApiProperty({
    description: "Email de l'utilisateur",
    example: "john.doe@example.com",
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: "L'email n'est pas valide" })
  email?: string;

  @ApiProperty({
    description: "ID de l'organisation",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiProperty({
    description: "Nom de l'établissement",
    example: "Mon École",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, {
    message: "Le nom de l'établissement doit contenir au moins 2 caractères",
  })
  @MaxLength(255, {
    message: "Le nom de l'établissement doit contenir au plus 255 caractères",
  })
  organizationName?: string;
}

export class UpdateAvatarDto {
  @ApiProperty({
    description: "URL de l'avatar (après upload sur S3)",
    example: "https://bucket.s3.region.amazonaws.com/avatars/user-123.jpg",
  })
  @IsString()
  @IsNotEmpty({ message: "L'URL de l'avatar est requise" })
  @IsUrl({}, { message: "L'URL de l'avatar n'est pas valide" })
  @MaxLength(500, {
    message: "L'URL de l'avatar doit contenir au plus 500 caractères",
  })
  avatarUrl: string;
}

