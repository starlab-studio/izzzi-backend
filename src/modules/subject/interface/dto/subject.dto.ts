import { IsString, MinLength, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class CreateSubjectDto {
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

  @ApiProperty({
    description: "Nom de l'intervenant",
    example: "M. Martin",
    required: false,
    nullable: true,
  })
  @IsString({ message: "Instructor name must be a string" })
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) => value ?? null)
  instructorName?: string | null;

  @ApiProperty({
    description: "Email de l'intervenant",
    example: "martin@ecole.fr",
    required: false,
    nullable: true,
  })
  @IsString({ message: "Instructor email must be a string" })
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) => value ?? null)
  instructorEmail?: string | null;

  @ApiProperty({
    description: "Date du premier cours (format YYYY-MM-DD)",
    example: "2025-01-15",
    required: false,
    nullable: true,
  })
  @IsString({ message: "First course date must be a string" })
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) => value ?? null)
  firstCourseDate?: string | null;

  @ApiProperty({
    description: "Date du dernier cours (format YYYY-MM-DD)",
    example: "2025-06-15",
    required: false,
    nullable: true,
  })
  @IsString({ message: "Last course date must be a string" })
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) => value ?? null)
  lastCourseDate?: string | null;

  @ApiProperty({
    description: "ID de la classe à laquelle assigner le sujet",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID(4, { message: "Class ID must be a valid UUID" })
  @IsNotEmpty({ message: "Class ID is required" })
  classId: string;

  @ApiProperty({
    description: "ID de l'organisation (utilisé par le guard pour validation)",
    example: "d405cc32-58ac-42a0-9c2d-e9e81398bc73",
  })
  @IsUUID(4, { message: "Organization ID must be a valid UUID" })
  @IsNotEmpty({ message: "Organization ID is required" })
  organizationId: string;
}

export class UpdateSubjectDto {
  @ApiProperty({
    description: "Nom du sujet",
    example: "Mathématiques",
    required: false,
  })
  @IsString({ message: "Subject name must be a string" })
  @IsOptional()
  @MinLength(1, {
    message: "Subject name must be at least 1 character long",
  })
  name?: string;

  @ApiProperty({
    description: "Nom de l'intervenant",
    example: "M. Martin",
    required: false,
    nullable: true,
  })
  @IsString({ message: "Instructor name must be a string" })
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) => value ?? null)
  instructorName?: string | null;

  @ApiProperty({
    description: "Email de l'intervenant",
    example: "martin@ecole.fr",
    required: false,
    nullable: true,
  })
  @IsString({ message: "Instructor email must be a string" })
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) => value ?? null)
  instructorEmail?: string | null;

  @ApiProperty({
    description: "Date du premier cours (format YYYY-MM-DD)",
    example: "2025-01-15",
    required: false,
    nullable: true,
  })
  @IsString({ message: "First course date must be a string" })
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) => value ?? null)
  firstCourseDate?: string | null;

  @ApiProperty({
    description: "Date du dernier cours (format YYYY-MM-DD)",
    example: "2025-06-15",
    required: false,
    nullable: true,
  })
  @IsString({ message: "Last course date must be a string" })
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) => value ?? null)
  lastCourseDate?: string | null;
}
