import { FileType, MimeType } from '../../domain/value-objects/file-type.vo';

export class GenerateUploadUrlCommand {
  constructor(
    public readonly fileName: string,
    public readonly mimeType: MimeType,
    public readonly fileType: FileType,
    public readonly fileSize: number,
    public readonly customFolder?: string,
  ) {}
}

export class UploadUrlResult {
  constructor(
    public readonly uploadUrl: string,
    public readonly fileKey: string,
    public readonly fileUrl: string,
    public readonly expiresIn: number,
    public readonly requiredHeaders: Record<string, string>,
  ) {}
}
