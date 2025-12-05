import { IsString, MinLength, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ISubjectCreate } from "../../domain/types";

export class CreateSubjectDto
  implements Omit<ISubjectCreate, "organizationId" | "createdBy">
{
  @ApiProperty({
    description: "Nom du sujet",
    example: "Mathématiques",
  })
  @IsString({ message: "Subject name must be a string" })
  @IsNotEmpty({ message: "Subject name is required" })
  @MinLength(1, {
    message: "Subject name must be at least 1 character long",
  })
  name: string;

  color: string;

  @ApiProperty({
    description: "Description du sujet",
    example: "Cours de mathématiques avancés",
    required: false,
  })
  @IsString({ message: "Description must be a string" })
  @IsOptional()
  description: string | null;
}
