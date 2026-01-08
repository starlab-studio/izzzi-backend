import { FileType, MimeType } from "./file-type.vo";

export class FileMetadata {
  constructor(
    public readonly fileName: string,
    public readonly mimeType: MimeType,
    public readonly fileType: FileType,
    public readonly fileSize: number,
    public readonly customFolder?: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.fileName || this.fileName.trim().length === 0) {
      throw new Error("File name cannot be empty");
    }

    if (this.fileSize <= 0) {
      throw new Error("File size must be greater than 0");
    }

    if (this.fileSize > 100 * 1024 * 1024) {
      throw new Error("File size cannot exceed 100MB");
    }
  }

  getSanitizedFileName(): string {
    return this.fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
}
