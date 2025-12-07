import {
  IsString,
  IsInt,
  MinLength,
  Min,
  IsNotEmpty,
  IsOptional,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { IClassCreate } from "../../domain/types";

export class CreateClassDto
  implements Omit<IClassCreate, "organizationId" | "userId">
{
  @ApiProperty({
    description: "Nom de la classe",
    example: "Terminale S1",
  })
  @IsString({ message: "Class name must be a string" })
  @IsNotEmpty({ message: "Class name is required" })
  @MinLength(1, { message: "Class name must contain at least 1 character" })
  name: string;

  @ApiProperty({
    description: "Nombre d'étudiants",
    example: 25,
  })
  @IsInt({ message: "Number of students must be an integer" })
  @Min(1, { message: "Number of students must be greater than 0" })
  @IsNotEmpty({ message: "Number of students is required" })
  numberOfStudents: number;

  @ApiProperty({
    description:
      "Adresses email des étudiants (séparées par des point-virgules)",
    example:
      "etudiant1@example.com;etudiant2@example.com;etudiant3@example.com",
  })
  @IsString({ message: "Student emails must be a string" })
  @IsNotEmpty({ message: "Student emails are required" })
  studentEmails: string;

  @ApiProperty({
    description: "Description de la classe",
    example: "Classe de Terminale S spécialité Mathématiques",
    required: false,
  })
  @IsString({ message: "Description must be a string" })
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) => value ?? null)
  description: string | null;
}
