import {
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
  Matches,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ISubjectCreate } from "../../domain/types";

export class CreateSubjectDto
  implements Omit<ISubjectCreate, "organizationId" | "userId">
{
  @ApiProperty({
    description: "Nom du sujet",
    example: "Mathématiques",
  })
  @IsString({ message: "Le nom du sujet doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "Le nom du sujet est obligatoire" })
  @MinLength(1, {
    message: "Le nom du sujet doit contenir au moins 1 caractère",
  })
  name: string;

  @ApiProperty({
    description: "Couleur du sujet au format hexadécimal",
    example: "#1E90FF",
  })
  @IsString({ message: "La couleur doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "La couleur du sujet est obligatoire" })
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: "La couleur doit être au format hexadécimal (#RRGGBB)",
  })
  color: string;

  @ApiProperty({
    description: "Description du sujet",
    example: "Cours de mathématiques avancés",
    required: false,
  })
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @IsOptional()
  description?: string;
}
