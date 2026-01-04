import { RefreshToken } from "src/modules/auth/domain/entities/refreshToken.entity";

describe("RefreshToken", () => {
  describe("create", () => {
    it("should create token with required fields", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt
      );

      expect(token.id).toBeDefined();
      expect(token.tokenHash).toBe("token-hash");
      expect(token.userId).toBe("user-123");
      expect(token.expiresAt).toEqual(expiresAt);
      expect(token.isRevoked).toBe(false);
      expect(token.deviceInfo).toBeUndefined();
      expect(token.ipAddress).toBeUndefined();
    });

    it("should create token with optional fields", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt,
        "device-info",
        "192.168.1.1"
      );

      expect(token.deviceInfo).toBe("device-info");
      expect(token.ipAddress).toBe("192.168.1.1");
    });
  });

  describe("isValid", () => {
    it("should return true for valid unrevoked token", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt
      );

      expect(token.isValid()).toBe(true);
    });

    it("should return false for revoked token", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt
      );

      token.revoke();

      expect(token.isValid()).toBe(false);
    });

    it("should return false for expired token", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() - 1);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt
      );

      expect(token.isValid()).toBe(false);
    });
  });

  describe("isExpired", () => {
    it("should return false for future expiration", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt
      );

      expect(token.isExpired()).toBe(false);
    });

    it("should return true for past expiration", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() - 1);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt
      );

      expect(token.isExpired()).toBe(true);
    });
  });

  describe("revoke", () => {
    it("should revoke token", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt
      );

      token.revoke();

      expect(token.isRevoked).toBe(true);
      expect(token.revokedAt).toBeDefined();
    });

    it("should throw error when revoking already revoked token", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt
      );

      token.revoke();

      expect(() => token.revoke()).toThrow("Token already revoked");
    });
  });

  describe("matchesDevice", () => {
    it("should return true when device matches", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt,
        "device-info"
      );

      expect(token.matchesDevice("device-info")).toBe(true);
    });

    it("should return false when device does not match", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt,
        "device-info"
      );

      expect(token.matchesDevice("other-device")).toBe(false);
    });

    it("should return true when no device info stored", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt
      );

      expect(token.matchesDevice("any-device")).toBe(true);
    });
  });

  describe("isNearExpiration", () => {
    it("should return true when near expiration", () => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 12);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt
      );

      expect(token.isNearExpiration(24)).toBe(true);
    });

    it("should return false when far from expiration", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 10);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt
      );

      expect(token.isNearExpiration(24)).toBe(false);
    });

    it("should use custom hours threshold", () => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt
      );

      expect(token.isNearExpiration(3)).toBe(true);
      expect(token.isNearExpiration(1)).toBe(false);
    });
  });

  describe("recordUsage", () => {
    it("should update lastUsedAt timestamp", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt
      );

      const beforeUsage = token.lastUsedAt;
      token.recordUsage();

      expect(token.lastUsedAt).toBeDefined();
      expect(token.lastUsedAt).not.toEqual(beforeUsage);
    });
  });

  describe("toPersistence", () => {
    it("should return persistence data", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const token = RefreshToken.create(
        "token-hash",
        "user-123",
        expiresAt,
        "device-info",
        "192.168.1.1"
      );

      const persistence = token.toPersistence();

      expect(persistence.id).toBe(token.id);
      expect(persistence.tokenHash).toBe("token-hash");
      expect(persistence.userId).toBe("user-123");
      expect(persistence.deviceInfo).toBe("device-info");
      expect(persistence.ipAddress).toBe("192.168.1.1");
    });
  });

  describe("reconstitute", () => {
    it("should recreate token from persistence data", () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const data = {
        id: "existing-id",
        tokenHash: "token-hash",
        userId: "user-123",
        deviceInfo: "device-info",
        ipAddress: "192.168.1.1",
        isRevoked: true,
        expiresAt,
        revokedAt: new Date(),
        lastUsedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const token = RefreshToken.reconstitute(data);

      expect(token.id).toBe("existing-id");
      expect(token.isRevoked).toBe(true);
      expect(token.revokedAt).toBeDefined();
      expect(token.lastUsedAt).toBeDefined();
    });
  });
});

