import { PasswordResetToken } from "src/modules/auth/domain/entities/passwordResetToken.entity";

describe("PasswordResetToken", () => {
  describe("create", () => {
    it("should create token with required fields", () => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const token = PasswordResetToken.create(
        "token-hash",
        "user-123",
        "test@example.com",
        expiresAt
      );

      expect(token.id).toBeDefined();
      expect(token.tokenHash).toBe("token-hash");
      expect(token.userId).toBe("user-123");
      expect(token.email).toBe("test@example.com");
      expect(token.expiresAt).toEqual(expiresAt);
      expect(token.isUsed).toBe(false);
      expect(token.usedAt).toBeUndefined();
    });
  });

  describe("isValid", () => {
    it("should return true for valid unused token", () => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const token = PasswordResetToken.create(
        "token-hash",
        "user-123",
        "test@example.com",
        expiresAt
      );

      expect(token.isValid()).toBe(true);
    });

    it("should return false for used token", () => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const token = PasswordResetToken.create(
        "token-hash",
        "user-123",
        "test@example.com",
        expiresAt
      );

      token.markAsUsed();

      expect(token.isValid()).toBe(false);
    });

    it("should return false for expired token", () => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() - 1);

      const token = PasswordResetToken.create(
        "token-hash",
        "user-123",
        "test@example.com",
        expiresAt
      );

      expect(token.isValid()).toBe(false);
    });
  });

  describe("isExpired", () => {
    it("should return false for future expiration", () => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const token = PasswordResetToken.create(
        "token-hash",
        "user-123",
        "test@example.com",
        expiresAt
      );

      expect(token.isExpired()).toBe(false);
    });

    it("should return true for past expiration", () => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() - 1);

      const token = PasswordResetToken.create(
        "token-hash",
        "user-123",
        "test@example.com",
        expiresAt
      );

      expect(token.isExpired()).toBe(true);
    });
  });

  describe("markAsUsed", () => {
    it("should mark token as used", () => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const token = PasswordResetToken.create(
        "token-hash",
        "user-123",
        "test@example.com",
        expiresAt
      );

      token.markAsUsed();

      expect(token.isUsed).toBe(true);
      expect(token.usedAt).toBeDefined();
    });

    it("should throw error when marking already used token", () => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const token = PasswordResetToken.create(
        "token-hash",
        "user-123",
        "test@example.com",
        expiresAt
      );

      token.markAsUsed();

      expect(() => token.markAsUsed()).toThrow("Token already used");
    });
  });

  describe("toPersistence", () => {
    it("should return persistence data", () => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const token = PasswordResetToken.create(
        "token-hash",
        "user-123",
        "test@example.com",
        expiresAt
      );

      const persistence = token.toPersistence();

      expect(persistence.id).toBe(token.id);
      expect(persistence.tokenHash).toBe("token-hash");
      expect(persistence.userId).toBe("user-123");
      expect(persistence.email).toBe("test@example.com");
    });
  });

  describe("reconstitute", () => {
    it("should recreate token from persistence data", () => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const data = {
        id: "existing-id",
        tokenHash: "token-hash",
        userId: "user-123",
        email: "test@example.com",
        expiresAt,
        isUsed: true,
        usedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const token = PasswordResetToken.reconstitute(data);

      expect(token.id).toBe("existing-id");
      expect(token.isUsed).toBe(true);
      expect(token.usedAt).toBeDefined();
    });
  });
});

