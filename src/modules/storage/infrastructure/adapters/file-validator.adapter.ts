import { Injectable, BadRequestException } from "@nestjs/common";
import { IFileValidator } from "../../domain/interfaces/file-validator.interface";
import { FileMetadata } from "../../domain/value-objects/file-metadata.vo";
import { FileType, MimeType } from "../../domain/value-objects/file-type.vo";

@Injectable()
export class FileValidatorAdapter implements IFileValidator {
  private readonly allowedMimeTypesMap: Record<FileType, MimeType[]> = {
    [FileType.IMAGE]: [
      MimeType.JPEG,
      MimeType.PNG,
      MimeType.GIF,
      MimeType.WEBP,
    ],
    [FileType.AVATAR]: [MimeType.JPEG, MimeType.PNG, MimeType.WEBP],
    [FileType.DOCUMENT]: [MimeType.PDF, MimeType.DOC, MimeType.DOCX],
    [FileType.VIDEO]: [MimeType.MP4, MimeType.WEBM, MimeType.MOV],
  };

  private readonly maxSizeMap: Record<FileType, number> = {
    [FileType.AVATAR]: 5 * 1024 * 1024,
    [FileType.IMAGE]: 10 * 1024 * 1024,
    [FileType.DOCUMENT]: 20 * 1024 * 1024,
    [FileType.VIDEO]: 100 * 1024 * 1024,
  };

  validate(metadata: FileMetadata): void {
    this.validateMimeType(metadata);
    this.validateFileSize(metadata);
  }

  private validateMimeType(metadata: FileMetadata): void {
    const allowedMimeTypes = this.allowedMimeTypesMap[metadata.fileType] || [];

    if (!allowedMimeTypes.includes(metadata.mimeType)) {
      throw new BadRequestException(
        `MIME type not allowed for ${metadata.fileType}. Allowed types: ${allowedMimeTypes.join(", ")}`,
      );
    }
  }

  private validateFileSize(metadata: FileMetadata): void {
    const maxSize = this.maxSizeMap[metadata.fileType] || 10 * 1024 * 1024;

    if (metadata.fileSize > maxSize) {
      throw new BadRequestException(
        `File too large for ${metadata.fileType}. Maximum size: ${this.formatBytes(maxSize)}`,
      );
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}
