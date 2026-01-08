import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { FileType, MimeType } from "../../domain/value-objects/file-type.vo";

export class UploadRequestDto {
  @ApiProperty({
    description: "Nom du fichier à uploader",
    example: "profile-picture.jpg",
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: "Type MIME du fichier",
    example: MimeType.JPEG,
    enum: MimeType,
  })
  @IsEnum(MimeType, {
    message: "Type de fichier non autorisé",
  })
  @IsNotEmpty()
  mimeType: MimeType;

  @ApiProperty({
    description: "Type de fichier pour déterminer le bucket/dossier",
    example: FileType.IMAGE,
    enum: FileType,
  })
  @IsEnum(FileType)
  @IsNotEmpty()
  fileType: FileType;

  @ApiProperty({
    description: "Taille du fichier en octets",
    example: 1048576,
  })
  @IsInt()
  @Min(1)
  @Max(100 * 1024 * 1024)
  fileSize: number;

  @ApiProperty({
    description: "Dossier personnalisé (optionnel)",
    example: "products/123",
    required: false,
  })
  @IsString()
  @IsOptional()
  customFolder?: string;
}
