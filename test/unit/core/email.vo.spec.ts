import { Email } from "src/core/domain/value-objects/email.vo";
import { DomainError, ErrorCode } from "src/core";

describe("Email", () => {
  describe("create", () => {
    it("should create a valid email", () => {
      const email = Email.create("test@example.com");
      expect(email.value).toBe("test@example.com");
    });

    it("should normalize email to lowercase", () => {
      const email = Email.create("TEST@EXAMPLE.COM");
      expect(email.value).toBe("test@example.com");
    });

    it("should trim whitespace", () => {
      const email = Email.create("  test@example.com  ");
      expect(email.value).toBe("test@example.com");
    });

    it("should throw error for empty email", () => {
      expect(() => Email.create("")).toThrow(DomainError);
      expect(() => Email.create("")).toThrow("Email cannot be empty");
    });

    it("should throw error for invalid email format", () => {
      expect(() => Email.create("invalid-email")).toThrow(DomainError);
      expect(() => Email.create("invalid-email")).toThrow("Email format is invalid");
    });

    it("should throw error for email without @", () => {
      expect(() => Email.create("invalidemail.com")).toThrow(DomainError);
    });

    it("should throw error for email without domain", () => {
      expect(() => Email.create("test@")).toThrow(DomainError);
    });

    it("should throw error for email exceeding 320 characters", () => {
      const longEmail = "a".repeat(64) + "@" + "b".repeat(257) + ".com";
      expect(() => Email.create(longEmail)).toThrow(DomainError);
      expect(() => Email.create(longEmail)).toThrow("Email must not exceed 320 characters");
    });

    it("should throw error for local part exceeding 64 characters", () => {
      const longLocal = "a".repeat(65) + "@example.com";
      expect(() => Email.create(longLocal)).toThrow(DomainError);
      expect(() => Email.create(longLocal)).toThrow("Local part of email must not exceed 64 characters");
    });

    it("should throw error for domain part exceeding 255 characters", () => {
      const longDomain = "test@" + "a".repeat(256) + ".com";
      expect(() => Email.create(longDomain)).toThrow(DomainError);
      expect(() => Email.create(longDomain)).toThrow("Domain part of email must not exceed 255 characters");
    });

    it("should throw error for consecutive dots", () => {
      expect(() => Email.create("test..user@example.com")).toThrow(DomainError);
      expect(() => Email.create("test..user@example.com")).toThrow("Email format is invalid");
    });

    it("should throw error for local part starting with dot", () => {
      expect(() => Email.create(".test@example.com")).toThrow(DomainError);
      expect(() => Email.create(".test@example.com")).toThrow("Email format is invalid");
    });

    it("should throw error for local part ending with dot", () => {
      expect(() => Email.create("test.@example.com")).toThrow(DomainError);
      expect(() => Email.create("test.@example.com")).toThrow("Email format is invalid");
    });

    it("should accept valid email with special characters", () => {
      const email = Email.create("user+tag@example.com");
      expect(email.value).toBe("user+tag@example.com");
    });

    it("should accept valid email with numbers", () => {
      const email = Email.create("user123@example.com");
      expect(email.value).toBe("user123@example.com");
    });
  });

  describe("value", () => {
    it("should return the email value", () => {
      const email = Email.create("test@example.com");
      expect(email.value).toBe("test@example.com");
    });
  });

  describe("localPart", () => {
    it("should return the local part of email", () => {
      const email = Email.create("test@example.com");
      expect(email.localPart).toBe("test");
    });

    it("should return local part with special characters", () => {
      const email = Email.create("user+tag@example.com");
      expect(email.localPart).toBe("user+tag");
    });
  });

  describe("domain", () => {
    it("should return the domain part of email", () => {
      const email = Email.create("test@example.com");
      expect(email.domain).toBe("example.com");
    });

    it("should return domain with subdomain", () => {
      const email = Email.create("test@mail.example.com");
      expect(email.domain).toBe("mail.example.com");
    });
  });

  describe("isFromDomain", () => {
    it("should return true for matching domain", () => {
      const email = Email.create("test@example.com");
      expect(email.isFromDomain("example.com")).toBe(true);
    });

    it("should return false for non-matching domain", () => {
      const email = Email.create("test@example.com");
      expect(email.isFromDomain("other.com")).toBe(false);
    });

    it("should be case insensitive", () => {
      const email = Email.create("test@EXAMPLE.COM");
      expect(email.isFromDomain("example.com")).toBe(true);
      expect(email.isFromDomain("EXAMPLE.COM")).toBe(true);
    });
  });

  describe("getMasked", () => {
    it("should mask email with local part longer than 2 characters", () => {
      const email = Email.create("testuser@example.com");
      const masked = email.getMasked();
      expect(masked).toBe("te***@ex***.com");
    });

    it("should mask email with local part of 2 characters or less", () => {
      const email = Email.create("te@example.com");
      const masked = email.getMasked();
      expect(masked).toBe("t***@ex***.com");
    });

    it("should mask email with short domain name", () => {
      const email = Email.create("test@ex.com");
      const masked = email.getMasked();
      expect(masked).toBe("te**@e***.com");
    });

    it("should preserve TLD in masked email", () => {
      const email = Email.create("test@example.org");
      const masked = email.getMasked();
      expect(masked).toContain(".org");
    });

    it("should mask email correctly for various lengths", () => {
      const email1 = Email.create("ab@example.com");
      expect(email1.getMasked()).toBe("a***@ex***.com");

      const email2 = Email.create("abc@example.com");
      expect(email2.getMasked()).toBe("ab*@ex***.com");

      const email3 = Email.create("abcd@example.com");
      expect(email3.getMasked()).toBe("ab**@ex***.com");

      const email4 = Email.create("abcde@example.com");
      expect(email4.getMasked()).toBe("ab***@ex***.com");
    });
  });

  describe("equals", () => {
    it("should return true for same email", () => {
      const email1 = Email.create("test@example.com");
      const email2 = Email.create("test@example.com");
      expect(email1.equals(email2)).toBe(true);
    });

    it("should return false for different emails", () => {
      const email1 = Email.create("test@example.com");
      const email2 = Email.create("other@example.com");
      expect(email1.equals(email2)).toBe(false);
    });

    it("should return false for null", () => {
      const email = Email.create("test@example.com");
      expect(email.equals(null as any)).toBe(false);
    });

    it("should return false for undefined", () => {
      const email = Email.create("test@example.com");
      expect(email.equals(undefined as any)).toBe(false);
    });

    it("should be case insensitive", () => {
      const email1 = Email.create("TEST@EXAMPLE.COM");
      const email2 = Email.create("test@example.com");
      expect(email1.equals(email2)).toBe(true);
    });
  });

  describe("toString", () => {
    it("should return email value as string", () => {
      const email = Email.create("test@example.com");
      expect(email.toString()).toBe("test@example.com");
    });
  });

  describe("toJSON", () => {
    it("should return email value as JSON", () => {
      const email = Email.create("test@example.com");
      expect(email.toJSON()).toBe("test@example.com");
    });
  });
});

