import { GeneralUtils } from "src/utils/general.utils";

describe("GeneralUtils", () => {
  describe("generateToken", () => {
    it("should generate a token of the specified length", () => {
      const token = GeneralUtils.generateToken(32);
      expect(token).toBeDefined();
      expect(token.length).toBe(64);
    });

    it("should generate different tokens on each call", () => {
      const token1 = GeneralUtils.generateToken(16);
      const token2 = GeneralUtils.generateToken(16);
      expect(token1).not.toBe(token2);
    });

    it("should handle different lengths correctly", () => {
      const token8 = GeneralUtils.generateToken(8);
      const token16 = GeneralUtils.generateToken(16);
      expect(token8.length).toBe(16);
      expect(token16.length).toBe(32);
    });
  });

  describe("generateSlug", () => {
    it("should convert text to a valid slug", () => {
      const slug = GeneralUtils.generateSlug("Hello World");
      expect(slug).toBe("hello-world");
    });

    it("should handle special characters", () => {
      const slug = GeneralUtils.generateSlug("Café & Restaurant");
      expect(slug).toBe("cafe-restaurant");
    });

    it("should handle accented characters", () => {
      const slug = GeneralUtils.generateSlug("École Française");
      expect(slug).toBe("ecole-francaise");
    });

    it("should remove multiple spaces and hyphens", () => {
      const slug = GeneralUtils.generateSlug("Hello    World---Test");
      expect(slug).toBe("hello-world-test");
    });

    it("should handle empty string", () => {
      const slug = GeneralUtils.generateSlug("");
      expect(slug).toBe("");
    });
  });

  describe("parseEmails", () => {
    it("should parse a semicolon-separated email string", () => {
      const emails = GeneralUtils.parseEmails("test1@example.com;test2@example.com");
      expect(emails).toEqual(["test1@example.com", "test2@example.com"]);
    });

    it("should trim whitespace from emails", () => {
      const emails = GeneralUtils.parseEmails("test1@example.com ; test2@example.com ");
      expect(emails).toEqual(["test1@example.com", "test2@example.com"]);
    });

    it("should filter out empty strings", () => {
      const emails = GeneralUtils.parseEmails("test1@example.com;;test2@example.com");
      expect(emails).toEqual(["test1@example.com", "test2@example.com"]);
    });

    it("should return empty array for empty string", () => {
      const emails = GeneralUtils.parseEmails("");
      expect(emails).toEqual([]);
    });
  });

  describe("hashToken", () => {
    it("should hash a token using SHA256", () => {
      const token = "test-token";
      const hash = GeneralUtils.hashToken(token);
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });

    it("should produce the same hash for the same token", () => {
      const token = "test-token";
      const hash1 = GeneralUtils.hashToken(token);
      const hash2 = GeneralUtils.hashToken(token);
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different tokens", () => {
      const hash1 = GeneralUtils.hashToken("token1");
      const hash2 = GeneralUtils.hashToken("token2");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const token = "test-token";
      const hashedToken = GeneralUtils.hashToken(token);
      const isValid = GeneralUtils.verifyToken(token, hashedToken);
      expect(isValid).toBe(true);
    });

    it("should reject an invalid token", () => {
      const token = "test-token";
      const wrongToken = "wrong-token";
      const hashedToken = GeneralUtils.hashToken(token);
      const isValid = GeneralUtils.verifyToken(wrongToken, hashedToken);
      expect(isValid).toBe(false);
    });
  });
});

