import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class DeleteRequestDto {
  @ApiProperty({
    description: "Clé du fichier à supprimer dans S3",
    example: "uploads/images/2024/12/uuid-filename.jpg",
  })
  @IsString()
  @IsNotEmpty()
  fileKey: string;
}

export class DeleteResponseDto {
  @ApiProperty({
    description: "Succès de la suppression",
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "Message de confirmation",
    example: "File deleted successfully",
  })
  message: string;
}
