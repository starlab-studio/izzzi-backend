import { ApiProperty } from "@nestjs/swagger";

export class UploadResponseDto {
  @ApiProperty({
    description: "URL présignée pour l'upload",
    example: "https://bucket.s3.region.amazonaws.com/path/to/file?X-Amz-...",
  })
  uploadUrl: string;

  @ApiProperty({
    description: "Clé du fichier dans S3",
    example: "uploads/images/2024/12/uuid-filename.jpg",
  })
  fileKey: string;

  @ApiProperty({
    description: "URL publique du fichier (après upload)",
    example: "https://bucket.s3.region.amazonaws.com/path/to/file",
  })
  fileUrl: string;

  @ApiProperty({
    description: "Durée de validité de l'URL présignée en secondes",
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: "Headers requis pour l'upload",
    example: {
      "Content-Type": "image/jpeg",
    },
  })
  requiredHeaders: Record<string, string>;
}
