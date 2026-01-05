import { FileMetadata } from '../value-objects/file-metadata.vo';

export interface IFileKeyGenerator {
  generate(metadata: FileMetadata): string;
}

export const FILE_KEY_GENERATOR = Symbol('FILE_KEY_GENERATOR');
