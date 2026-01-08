import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { STORAGE_SERVICE } from "../../domain/interfaces/storage.interface";
import type { IStorageService } from "../../domain/interfaces/storage.interface";
import { FILE_KEY_GENERATOR } from "../../domain/interfaces/file-key-generator.interface";
import type { IFileKeyGenerator } from "../../domain/interfaces/file-key-generator.interface";
import { FILE_VALIDATOR } from "../../domain/interfaces/file-validator.interface";
import type { IFileValidator } from "../../domain/interfaces/file-validator.interface";
import { FileMetadata } from "../../domain/value-objects/file-metadata.vo";
import { FileEntity } from "../../domain/entities/file.entity";
import {
  GenerateUploadUrlCommand,
  UploadUrlResult,
} from "../dto/generate-upload-url.dto";

@Injectable()
export class GenerateUploadUrlUseCase {
  private readonly DEFAULT_UPLOAD_EXPIRATION = 900;

  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
    @Inject(FILE_KEY_GENERATOR)
    private readonly fileKeyGenerator: IFileKeyGenerator,
    @Inject(FILE_VALIDATOR) private readonly fileValidator: IFileValidator,
  ) {}

  async execute(command: GenerateUploadUrlCommand): Promise<UploadUrlResult> {
    try {
      const metadata = new FileMetadata(
        command.fileName,
        command.mimeType,
        command.fileType,
        command.fileSize,
        command.customFolder,
      );

      this.fileValidator.validate(metadata);

      const fileKey = this.fileKeyGenerator.generate(metadata);

      const presignedUrl = await this.storageService.generateUploadUrl(
        fileKey,
        metadata,
        this.DEFAULT_UPLOAD_EXPIRATION,
      );

      const fileUrl = this.storageService.getPublicUrl(fileKey);

      const file = FileEntity.create(fileKey, fileUrl, metadata);

      return new UploadUrlResult(
        presignedUrl.url,
        file.key,
        file.url,
        presignedUrl.expiresIn,
        {
          "Content-Type": metadata.mimeType,
        },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to generate upload URL: ${error.message}`,
      );
    }
  }
}
