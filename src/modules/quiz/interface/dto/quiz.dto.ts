import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsIn, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class AssignQuizPairDto {
  @ApiProperty({
    description: "ID de la paire de templates de questionnaires",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  templatePairId: string;
}

class QuestionDto {
  @ApiProperty({ description: "Texte de la question" })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ 
    description: "Type de question",
    enum: ["stars", "radio", "checkbox", "textarea"]
  })
  @IsString()
  @IsIn(["stars", "radio", "checkbox", "textarea"])
  type: "stars" | "radio" | "checkbox" | "textarea";

  @ApiProperty({ 
    description: "Options de réponse (pour radio et checkbox)",
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({ 
    description: "Catégorie de la question",
    enum: ["global", "course", "instructor"]
  })
  @IsString()
  @IsIn(["global", "course", "instructor"])
  category: "global" | "course" | "instructor";

  @ApiProperty({ description: "Index d'ordre de la question" })
  @IsNumber()
  orderIndex: number;
}

class TemplateDto {
  @ApiProperty({ description: "Nom du template" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "Description du template", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: "Questions du template",
    type: [QuestionDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}

export class CreateQuizTemplatePairDto {
  @ApiProperty({ description: "Nom de la paire de templates" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "Description de la paire", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: "Template pour le formulaire pendant le cours",
    type: TemplateDto
  })
  @ValidateNested()
  @Type(() => TemplateDto)
  duringCourseTemplate: TemplateDto;

  @ApiProperty({ 
    description: "Template pour le formulaire après le cours",
    type: TemplateDto
  })
  @ValidateNested()
  @Type(() => TemplateDto)
  afterCourseTemplate: TemplateDto;
}

