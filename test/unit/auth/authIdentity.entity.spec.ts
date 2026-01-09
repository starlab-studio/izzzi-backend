import { AuthIdentityEntity } from "src/modules/auth/domain/entities/authIdentity.entity";
import { AuthIdentityName, IAuthIdentity } from "src/modules/auth/domain/types";

describe("AuthIdentityEntity", () => {
  describe("create", () => {
    it("should create auth identity with required fields", () => {
      const data = {
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
        password: "hashed-password",
      };

      const entity = AuthIdentityEntity.create(data);

      expect(entity.id).toBeDefined();
      expect(entity.provider).toBe(AuthIdentityName.CUSTOM);
      expect(entity.providerUserId).toBe("user-123");
      expect(entity.username).toBe("test@example.com");
      expect(entity.password).toBe("hashed-password");
      expect(entity.failedLoginAttempts).toBe(0);
      expect(entity.isLocked).toBe(false);
      expect(entity.isEmailVerified).toBe(false);
    });

    it("should create auth identity without password", () => {
      const data = {
        provider: AuthIdentityName.AWS_COGNITO,
        providerUserId: "cognito-user-123",
        username: "test@example.com",
      };

      const entity = AuthIdentityEntity.create(data);

      expect(entity.provider).toBe(AuthIdentityName.AWS_COGNITO);
      expect(entity.password).toBeUndefined();
    });
  });

  describe("setUser", () => {
    it("should set user id", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      const beforeUpdate = entity.updatedAt;
      
      entity.setUser("user-id-456");

      expect(entity.userId).toBe("user-id-456");
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  describe("canChangePassword", () => {
    it("should return true for CUSTOM provider", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      expect(entity.canChangePassword(AuthIdentityName.CUSTOM)).toBe(true);
    });

    it("should return false for non-CUSTOM provider", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.AWS_COGNITO,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      expect(entity.canChangePassword(AuthIdentityName.AWS_COGNITO)).toBe(false);
    });
  });

  describe("changePassword", () => {
    it("should update password", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
        password: "old-hash",
      });

      const beforeUpdate = entity.updatedAt;
      entity.changePassword("new-hash");

      expect(entity.password).toBe("new-hash");
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  describe("isAccountLocked", () => {
    it("should return false when not locked", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      expect(entity.isAccountLocked()).toBe(false);
    });

    it("should return false when lock expired", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 10);
      
      (entity as any).props.isLocked = true;
      (entity as any).props.lockedUntil = pastDate;

      expect(entity.isAccountLocked()).toBe(false);
    });

    it("should return true when locked and not expired", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 30);
      
      (entity as any).props.isLocked = true;
      (entity as any).props.lockedUntil = futureDate;

      expect(entity.isAccountLocked()).toBe(true);
    });
  });

  describe("recordFailedLoginAttempt", () => {
    it("should increment failed attempts", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      entity.recordFailedLoginAttempt(5);

      expect(entity.failedLoginAttempts).toBe(1);
      expect(entity.lastFailedLoginAt).toBeDefined();
    });

    it("should lock account after max attempts", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      for (let i = 0; i < 5; i++) {
        entity.recordFailedLoginAttempt(5);
      }

      expect(entity.failedLoginAttempts).toBe(5);
      expect(entity.isLocked).toBe(true);
      expect(entity.lockedUntil).toBeDefined();
    });
  });

  describe("resetFailedLoginAttempts", () => {
    it("should reset failed attempts to zero", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      entity.recordFailedLoginAttempt(5);
      entity.recordFailedLoginAttempt(5);
      entity.resetFailedLoginAttempts();

      expect(entity.failedLoginAttempts).toBe(0);
      expect(entity.lastFailedLoginAt).toBeNull();
    });
  });

  describe("lockAccount", () => {
    it("should lock account for specified duration", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      entity.lockAccount(30);

      expect(entity.isLocked).toBe(true);
      expect(entity.lockedUntil).toBeDefined();
      
      const expectedLockTime = new Date();
      expectedLockTime.setMinutes(expectedLockTime.getMinutes() + 30);
      expect(entity.lockedUntil!.getTime()).toBeCloseTo(expectedLockTime.getTime(), -3);
    });
  });

  describe("unlockAccount", () => {
    it("should unlock account", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      entity.lockAccount(30);
      entity.unlockAccount();

      expect(entity.isLocked).toBe(false);
      expect(entity.lockedUntil).toBeNull();
    });
  });

  describe("verifyEmail", () => {
    it("should mark email as verified", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      entity.verifyEmail("test@example.com");

      expect(entity.isEmailVerified).toBe(true);
    });

    it("should throw error for mismatched email", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      expect(() => entity.verifyEmail("other@example.com")).toThrow();
    });
  });

  describe("toPersistence", () => {
    it("should return persistence data", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      const persistence = entity.toPersistence();

      expect(persistence.id).toBe(entity.id);
      expect(persistence.provider).toBe(AuthIdentityName.CUSTOM);
      expect(persistence.username).toBe("test@example.com");
    });
  });

  describe("updateUsername", () => {
    it("should update username and reset email verification", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "old@example.com",
      });

      entity.verifyEmail("old@example.com");
      entity.updateUsername("new@example.com");

      expect(entity.username).toBe("new@example.com");
      expect(entity.isEmailVerified).toBe(false);
    });

    it("should trim whitespace from username", () => {
      const entity = AuthIdentityEntity.create({
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
      });

      entity.updateUsername("  new@example.com  ");

      expect(entity.username).toBe("new@example.com");
    });
  });

  describe("reconstitute", () => {
    it("should recreate entity from persistence data", () => {
      const data: IAuthIdentity = {
        id: "existing-id",
        provider: AuthIdentityName.CUSTOM,
        providerUserId: "user-123",
        username: "test@example.com",
        password: "hashed",
        failedLoginAttempts: 2,
        lastFailedLoginAt: new Date(),
        lockedUntil: null,
        isLocked: false,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const entity = AuthIdentityEntity.reconstitute(data);

      expect(entity.id).toBe("existing-id");
      expect(entity.failedLoginAttempts).toBe(2);
      expect(entity.isEmailVerified).toBe(true);
    });
  });
});

