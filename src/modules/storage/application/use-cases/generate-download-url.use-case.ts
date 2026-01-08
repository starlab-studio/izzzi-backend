import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { STORAGE_SERVICE } from "../../domain/interfaces/storage.interface";
import type { IStorageService } from "../../domain/interfaces/storage.interface";
import {
  GenerateDownloadUrlCommand,
  DownloadUrlResult,
} from "../dto/generate-download-url.dto";

@Injectable()
export class GenerateDownloadUrlUseCase {
  private readonly DEFAULT_DOWNLOAD_EXPIRATION = 900;
  private readonly MAX_DOWNLOAD_EXPIRATION = 604800;

  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
  ) {}

  async execute(
    command: GenerateDownloadUrlCommand,
  ): Promise<DownloadUrlResult> {
    try {
      const exists = await this.storageService.fileExists(command.fileKey);
      if (!exists) {
        throw new NotFoundException(`File not found: ${command.fileKey}`);
      }

      const expiresIn = command.expiresIn || this.DEFAULT_DOWNLOAD_EXPIRATION;
      if (expiresIn > this.MAX_DOWNLOAD_EXPIRATION) {
        throw new BadRequestException(
          `Expiration time cannot exceed ${this.MAX_DOWNLOAD_EXPIRATION} seconds`,
        );
      }

      const presignedUrl = await this.storageService.generateDownloadUrl(
        command.fileKey,
        expiresIn,
      );

      return new DownloadUrlResult(
        presignedUrl.url,
        presignedUrl.expiresIn,
        presignedUrl.getExpiresAt().toISOString(),
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to generate download URL: ${error.message}`,
      );
    }
  }
}
