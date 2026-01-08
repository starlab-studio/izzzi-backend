import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { AuthGuard } from "src/core/interfaces/guards/auth.guard";
import { GenerateUploadUrlUseCase } from "../../application/use-cases/generate-upload-url.use-case";
import { GenerateDownloadUrlUseCase } from "../../application/use-cases/generate-download-url.use-case";
import { DeleteFileUseCase } from "../../application/use-cases/delete-file.use-case";
import { GenerateUploadUrlCommand } from "../../application/dto/generate-upload-url.dto";
import { GenerateDownloadUrlCommand } from "../../application/dto/generate-download-url.dto";
import { DeleteFileCommand } from "../../application/dto/delete-file.dto";
import { UploadRequestDto } from "../dto/upload-request.dto";
import { UploadResponseDto } from "../dto/upload-response.dto";
import {
  DownloadRequestDto,
  DownloadResponseDto,
} from "../dto/download-request.dto";
import { DeleteRequestDto, DeleteResponseDto } from "../dto/delete-request.dto";

@ApiTags("Storage")
@Controller("v1/storage")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(
    private readonly generateUploadUrlUseCase: GenerateUploadUrlUseCase,
    private readonly generateDownloadUrlUseCase: GenerateDownloadUrlUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
  ) {}

  @Post("presigned-upload")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Générer une URL présignée pour l'upload d'un fichier",
    description: `
      Génère une URL présignée AWS S3 pour permettre l'upload direct d'un fichier depuis le client.
      L'URL est valide pendant 15 minutes par défaut.
      
      Étapes pour uploader un fichier:
      1. Appelez cet endpoint pour obtenir l'uploadUrl
      2. Utilisez l'uploadUrl pour envoyer le fichier avec une requête PUT
      3. Incluez les headers requis (Content-Type) dans votre requête
      4. Utilisez fileUrl pour référencer le fichier après l'upload
    `,
  })
  @ApiBody({ type: UploadRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "URL présignée générée avec succès",
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      "Requête invalide (type de fichier non autorisé, taille excessive, etc.)",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Non authentifié",
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Erreur serveur lors de la génération de l'URL",
  })
  async generatePresignedUploadUrl(
    @Body() dto: UploadRequestDto,
  ): Promise<UploadResponseDto> {
    const command = new GenerateUploadUrlCommand(
      dto.fileName,
      dto.mimeType,
      dto.fileType,
      dto.fileSize,
      dto.customFolder,
    );

    const result = await this.generateUploadUrlUseCase.execute(command);

    return {
      uploadUrl: result.uploadUrl,
      fileKey: result.fileKey,
      fileUrl: result.fileUrl,
      expiresIn: result.expiresIn,
      requiredHeaders: result.requiredHeaders,
    };
  }

  @Post("presigned-download")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Générer une URL présignée pour le téléchargement d'un fichier",
    description: `
      Génère une URL présignée AWS S3 pour permettre le téléchargement sécurisé d'un fichier.
      L'URL est valide pendant 15 minutes par défaut, mais peut être configurée jusqu'à 7 jours.
      
      Utilisez cette URL pour:
      - Télécharger des fichiers privés de manière sécurisée
      - Partager temporairement des fichiers avec des utilisateurs
      - Afficher des images/vidéos dans votre application
    `,
  })
  @ApiBody({ type: DownloadRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "URL présignée générée avec succès",
    type: DownloadResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Requête invalide (durée d'expiration excessive, etc.)",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Fichier non trouvé",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Non authentifié",
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Erreur serveur lors de la génération de l'URL",
  })
  async generatePresignedDownloadUrl(
    @Body() dto: DownloadRequestDto,
  ): Promise<DownloadResponseDto> {
    const command = new GenerateDownloadUrlCommand(dto.fileKey, dto.expiresIn);

    const result = await this.generateDownloadUrlUseCase.execute(command);

    return {
      downloadUrl: result.downloadUrl,
      expiresIn: result.expiresIn,
      expiresAt: result.expiresAt,
    };
  }

  @Delete("file")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Supprimer un fichier de S3",
    description: `
      Supprime définitivement un fichier du bucket S3.
      Cette action est irréversible.
      
      Note: Assurez-vous que l'utilisateur a les permissions nécessaires
      pour supprimer le fichier (vérifiez la propriété côté serveur).
    `,
  })
  @ApiBody({ type: DeleteRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Fichier supprimé avec succès",
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Fichier non trouvé",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Non authentifié",
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Erreur serveur lors de la suppression",
  })
  async deleteFile(@Body() dto: DeleteRequestDto): Promise<DeleteResponseDto> {
    const command = new DeleteFileCommand(dto.fileKey);

    const result = await this.deleteFileUseCase.execute(command);

    return {
      success: result.success,
      message: result.message,
    };
  }
}
