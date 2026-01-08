import { FileMetadata } from "../value-objects/file-metadata.vo";

export interface IFileValidator {
  validate(metadata: FileMetadata): void;
}

export const FILE_VALIDATOR = Symbol("FILE_VALIDATOR");
