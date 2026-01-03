import { FileMetadata } from '../value-objects/file-metadata.vo';
import { PresignedUrlEntity } from '../entities/presigned-url.entity';

export interface IStorageService {
  generateUploadUrl(
    fileKey: string,
    metadata: FileMetadata,
    expiresIn: number,
  ): Promise<PresignedUrlEntity>;

  generateDownloadUrl(fileKey: string, expiresIn: number): Promise<PresignedUrlEntity>;

  fileExists(fileKey: string): Promise<boolean>;

  deleteFile(fileKey: string): Promise<void>;

  getPublicUrl(fileKey: string): string;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
