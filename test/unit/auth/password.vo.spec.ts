import { Password } from "src/modules/auth/domain/value-objects/password.vo";
import { DomainError, ErrorCode } from "src/core";

describe("Password", () => {
  describe("create", () => {
    it("should create a password from plain text", async () => {
      const password = await Password.create("ValidPass572!@#");
      expect(password.isHashed).toBe(true);
      expect(password.value).toBeDefined();
      expect(password.value).not.toBe("ValidPass572!@#");
    });

    it("should throw error for empty password", async () => {
      await expect(Password.create("")).rejects.toThrow(DomainError);
      await expect(Password.create("")).rejects.toThrow("Password cannot be empty");
    });

    it("should throw error for password shorter than 8 characters", async () => {
      await expect(Password.create("Short1!")).rejects.toThrow(DomainError);
    });

    it("should throw error for password without lowercase", async () => {
      await expect(Password.create("PASSWORD123!")).rejects.toThrow(DomainError);
    });

    it("should throw error for password without uppercase", async () => {
      await expect(Password.create("password123!")).rejects.toThrow(DomainError);
    });

    it("should throw error for password without digit", async () => {
      await expect(Password.create("Password!")).rejects.toThrow(DomainError);
    });

    it("should throw error for password without special character", async () => {
      await expect(Password.create("Password123")).rejects.toThrow(DomainError);
    });

    it("should throw error for common patterns", async () => {
      await expect(Password.create("Password123!")).rejects.toThrow();
    });

    it("should throw error for sequential characters", async () => {
      await expect(Password.create("Abc123!@#")).rejects.toThrow(DomainError);
    });
  });

  describe("fromHash", () => {
    it("should create password from hash", () => {
      const hash = "$argon2id$v=19$m=65536,t=3,p=1$test$hash";
      const password = Password.fromHash(hash);
      expect(password.isHashed).toBe(true);
      expect(password.value).toBe(hash);
    });

    it("should throw error for empty hash", () => {
      expect(() => Password.fromHash("")).toThrow(DomainError);
    });
  });

  describe("compare", () => {
    it("should verify correct password", async () => {
      const plainPassword = "ValidPass572!@#";
      const password = await Password.create(plainPassword);
      const isValid = await password.compare(plainPassword);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = await Password.create("ValidPass572!@#");
      const isValid = await password.compare("WrongPassword572!@#");
      expect(isValid).toBe(false);
    });
  });

  describe("calculateStrength", () => {
    it("should calculate strength score", () => {
      const score = Password.calculateStrength("ValidPass572!@#");
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should return higher score for longer passwords", () => {
      const shortScore = Password.calculateStrength("Valid5!@");
      const longScore = Password.calculateStrength("VeryLongValidPassword572!@#");
      expect(longScore).toBeGreaterThan(shortScore);
    });
  });

  describe("getStrengthLabel", () => {
    it("should return correct label for weak password", () => {
      expect(Password.getStrengthLabel(30)).toBe("Weak");
    });

    it("should return correct label for fair password", () => {
      expect(Password.getStrengthLabel(50)).toBe("Fair");
    });

    it("should return correct label for good password", () => {
      expect(Password.getStrengthLabel(70)).toBe("Good");
    });

    it("should return correct label for strong password", () => {
      expect(Password.getStrengthLabel(90)).toBe("Strong");
    });
  });

  describe("equals", () => {
    it("should return true for same password", async () => {
      const password1 = await Password.create("ValidPass572!@#");
      const password2 = Password.fromHash(password1.value);
      expect(password1.equals(password2)).toBe(true);
    });

    it("should return false for different passwords", async () => {
      const password1 = await Password.create("ValidPass572!@#");
      const password2 = await Password.create("AnotherPass384!@#");
      expect(password1.equals(password2)).toBe(false);
    });
  });
});

