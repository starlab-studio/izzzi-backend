import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { MimeType } from "../../domain/value-objects/file-type.vo";

export class RegistrationAvatarUploadDto {
  @ApiProperty({ description: "Nom du fichier", example: "avatar.jpg" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fileName: string;

  @ApiProperty({
    description: "Type MIME",
    enum: [MimeType.JPEG, MimeType.PNG, MimeType.WEBP],
  })
  @IsEnum(MimeType)
  mimeType: MimeType;

  @ApiProperty({
    description: "Taille du fichier (max 3MB)",
    example: 1048576,
  })
  @IsInt()
  @Min(1)
  @Max(3 * 1024 * 1024)
  fileSize: number;
}
