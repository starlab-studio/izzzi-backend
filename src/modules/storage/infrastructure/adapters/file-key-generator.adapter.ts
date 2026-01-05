import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IFileKeyGenerator } from '../../domain/interfaces/file-key-generator.interface';
import { FileMetadata } from '../../domain/value-objects/file-metadata.vo';

@Injectable()
export class FileKeyGeneratorAdapter implements IFileKeyGenerator {
  generate(metadata: FileMetadata): string {
    const timestamp = new Date();
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, '0');
    const uuid = randomUUID();

    const sanitizedFileName = metadata.getSanitizedFileName();

    const basePath = metadata.customFolder
      ? `uploads/${metadata.fileType}/${metadata.customFolder}`
      : `uploads/${metadata.fileType}/${year}/${month}`;

    return `${basePath}/${uuid}-${sanitizedFileName}`;
  }
}
