import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';

export class DownloadRequestDto {
  @ApiProperty({
    description: 'Clé du fichier dans S3',
    example: 'uploads/images/2024/12/uuid-filename.jpg',
  })
  @IsString()
  @IsNotEmpty()
  fileKey: string;

  @ApiProperty({
    description: "Durée de validité de l'URL en secondes (défaut: 900 = 15min)",
    example: 900,
    required: false,
    minimum: 1,
    maximum: 604800,
  })
  @IsInt()
  @Min(1)
  @Max(604800)
  @IsOptional()
  expiresIn?: number;
}

export class DownloadResponseDto {
  @ApiProperty({
    description: 'URL présignée pour le téléchargement',
    example: 'https://bucket.s3.region.amazonaws.com/path/to/file?X-Amz-...',
  })
  downloadUrl: string;

  @ApiProperty({
    description: "Durée de validité de l'URL en secondes",
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: "Date d'expiration",
    example: '2024-12-09T15:30:00.000Z',
  })
  expiresAt: string;
}
