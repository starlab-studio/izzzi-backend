import { VerificationTokenEntity } from "src/modules/auth/domain/entities/verificationToken.entity";
import { VerificationTokenType } from "src/modules/auth/domain/types";
import { DomainError, ErrorCode } from "src/core";

describe("VerificationTokenEntity", () => {
  describe("create", () => {
    it("should create a valid verification token", () => {
      const token = VerificationTokenEntity.create(
        "test@example.com",
        VerificationTokenType.EMAIL_VERIFICATION
      );

      expect(token.email).toBe("test@example.com");
      expect(token.type).toBe(VerificationTokenType.EMAIL_VERIFICATION);
      expect(token.token).toBeDefined();
      expect(token.token.length).toBe(64);
      expect(token.isUsed).toBe(false);
      expect(token.expiresAt).toBeInstanceOf(Date);
      expect(token.usedAt).toBeNull();
    });

    it("should set expiration to 24 hours from creation", () => {
      const now = new Date();
      const token = VerificationTokenEntity.create(
        "test@example.com",
        VerificationTokenType.EMAIL_VERIFICATION
      );

      const expectedExpiration = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(token.expiresAt.getTime() - expectedExpiration.getTime());
      expect(timeDiff).toBeLessThan(1000);
    });
  });

  describe("isValid", () => {
    it("should return true for valid unused token", () => {
      const token = VerificationTokenEntity.create(
        "test@example.com",
        VerificationTokenType.EMAIL_VERIFICATION
      );
      expect(token.isValid()).toBe(true);
    });

    it("should return false for used token", () => {
      const token = VerificationTokenEntity.create(
        "test@example.com",
        VerificationTokenType.EMAIL_VERIFICATION
      );
      token.markAsUsed();
      expect(token.isValid()).toBe(false);
    });

    it("should return false for expired token", () => {
      const expiredData = {
        id: "id",
        email: "test@example.com",
        token: "token",
        type: VerificationTokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() - 1000),
        isUsed: false,
        usedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const token = VerificationTokenEntity.reconstitute(expiredData);
      expect(token.isValid()).toBe(false);
    });
  });

  describe("markAsUsed", () => {
    it("should mark token as used", () => {
      const token = VerificationTokenEntity.create(
        "test@example.com",
        VerificationTokenType.EMAIL_VERIFICATION
      );
      token.markAsUsed();
      expect(token.isUsed).toBe(true);
      expect(token.usedAt).toBeInstanceOf(Date);
    });

    it("should throw error when marking already used token", () => {
      const token = VerificationTokenEntity.create(
        "test@example.com",
        VerificationTokenType.EMAIL_VERIFICATION
      );
      token.markAsUsed();
      expect(() => token.markAsUsed()).toThrow(DomainError);
      expect(() => token.markAsUsed()).toThrow("Token already used");
    });
  });

  describe("reconstitute", () => {
    it("should reconstitute entity from persistence data", () => {
      const data = {
        id: "id",
        email: "test@example.com",
        token: "token",
        type: VerificationTokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(),
        isUsed: false,
        usedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const token = VerificationTokenEntity.reconstitute(data);
      expect(token.email).toBe(data.email);
      expect(token.token).toBe(data.token);
      expect(token.type).toBe(data.type);
    });
  });
});

