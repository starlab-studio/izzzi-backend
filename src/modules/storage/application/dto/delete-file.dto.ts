export class DeleteFileCommand {
  constructor(public readonly fileKey: string) {}
}

export class DeleteFileResult {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
  ) {}
}
