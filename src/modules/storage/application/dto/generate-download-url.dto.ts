export class GenerateDownloadUrlCommand {
  constructor(
    public readonly fileKey: string,
    public readonly expiresIn?: number,
  ) {}
}

export class DownloadUrlResult {
  constructor(
    public readonly downloadUrl: string,
    public readonly expiresIn: number,
    public readonly expiresAt: string,
  ) {}
}
