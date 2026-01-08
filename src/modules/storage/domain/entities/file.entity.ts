import { FileMetadata } from "../value-objects/file-metadata.vo";

export class FileEntity {
  constructor(
    public readonly key: string,
    public readonly url: string,
    public readonly metadata: FileMetadata,
    public readonly uploadedAt: Date,
  ) {}

  static create(key: string, url: string, metadata: FileMetadata): FileEntity {
    return new FileEntity(key, url, metadata, new Date());
  }

  isRecent(): boolean {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return this.uploadedAt > fifteenMinutesAgo;
  }
}
