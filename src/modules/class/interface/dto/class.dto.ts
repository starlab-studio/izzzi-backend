import {
  IsString,
  IsInt,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IClassCreate } from "../../domain/types";

export class CreateClassDto implements Omit<IClassCreate, "organizationId" | "userId"> {
  @ApiProperty({
    description: "Nom de la classe",
    example: "Terminale S1",
  })
  @IsString({ message: "Le nom de la classe doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "Le nom de la classe est obligatoire" })
  @MinLength(1, { message: "Le nom de la classe doit contenir au moins 1 caractère" })
  name: string;

  @ApiProperty({
    description: "Nombre d'étudiants",
    example: 25,
  })
  @IsInt({ message: "Le nombre d'étudiants doit être un nombre entier" })
  @Min(1, { message: "Le nombre d'étudiants doit être supérieur à 0" })
  @IsNotEmpty({ message: "Le nombre d'étudiants est obligatoire" })
  numberOfStudents: number;

  @ApiProperty({
    description: "Adresses email des étudiants (séparées par des point-virgules)",
    example: "etudiant1@example.com;etudiant2@example.com;etudiant3@example.com",
  })
  @IsString({ message: "Les adresses email doivent être une chaîne de caractères" })
  @IsNotEmpty({ message: "Les adresses email des étudiants sont obligatoires" })
  studentEmails: string;

  @ApiProperty({
    description: "Description de la classe",
    example: "Classe de Terminale S spécialité Mathématiques",
    required: false,
  })
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @IsOptional()
  description?: string;
}
