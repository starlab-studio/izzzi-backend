export class PresignedUrlEntity {
  constructor(
    public readonly url: string,
    public readonly expiresIn: number,
    public readonly createdAt: Date = new Date(),
  ) {
    if (expiresIn <= 0) {
      throw new Error("Expiration time must be greater than 0");
    }
  }

  getExpiresAt(): Date {
    return new Date(this.createdAt.getTime() + this.expiresIn * 1000);
  }

  isValid(): boolean {
    return new Date() < this.getExpiresAt();
  }

  getRemainingTime(): number {
    const remaining = this.getExpiresAt().getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }
}
