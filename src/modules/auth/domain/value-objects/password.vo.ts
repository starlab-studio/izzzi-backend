import * as argon2 from "argon2";
import { DomainError, ErrorCode } from "src/core";

export class Password {
  private readonly _hashedValue: string;
  private readonly _isHashed: boolean;

  private constructor(hashedValue: string, isHashed: boolean = true) {
    this._hashedValue = hashedValue;
    this._isHashed = isHashed;
  }

  public static async create(plainPassword: string): Promise<Password> {
    this.validate(plainPassword);
    const hashed = await this.hash(plainPassword);
    return new Password(hashed, true);
  }

  public static fromHash(hashedPassword: string): Password {
    if (!hashedPassword) {
      throw new DomainError(
        ErrorCode.INVALID_PASSWORD,
        "Hashed password cannot be empty",
      );
    }
    return new Password(hashedPassword, true);
  }

  private static validate(password: string): void {
    if (!password) {
      throw new DomainError(
        ErrorCode.INVALID_PASSWORD,
        "Password cannot be empty",
      );
    }

    if (password.length < 8) {
      throw new DomainError(
        ErrorCode.INVALID_PASSWORD,
        "Password must be at least 8 characters long",
      );
    }

    if (password.length > 128) {
      throw new DomainError(
        ErrorCode.INVALID_PASSWORD,
        "Password must not exceed 128 characters",
      );
    }

    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[\W_]/.test(password);

    if (!hasLowerCase) {
      throw new DomainError(
        ErrorCode.INVALID_PASSWORD,
        "Password must contain at least one lowercase letter",
      );
    }

    if (!hasUpperCase) {
      throw new DomainError(
        ErrorCode.INVALID_PASSWORD,
        "Password must contain at least one uppercase letter",
      );
    }

    if (!hasDigit) {
      throw new DomainError(
        ErrorCode.INVALID_PASSWORD,
        "Password must contain at least one number",
      );
    }

    if (!hasSpecialChar) {
      throw new DomainError(
        ErrorCode.INVALID_PASSWORD,
        "Password must contain at least one special character",
      );
    }

    const commonPatterns = [
      /password/i,
      /12345/,
      /qwerty/i,
      /abc123/i,
      /admin/i,
      /letmein/i,
      /welcome/i,
      /monkey/i,
      /dragon/i,
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        throw new DomainError(
          ErrorCode.INVALID_PASSWORD,
          "Password contains common patterns and is too weak",
        );
      }
    }

    if (this.hasSequentialCharacters(password)) {
      throw new DomainError(
        ErrorCode.INVALID_PASSWORD,
        "Password contains sequential characters (e.g., 'abc', '123')",
      );
    }

    if (/(.)\1{3,}/.test(password)) {
      throw new DomainError(
        ErrorCode.INVALID_PASSWORD,
        "Password contains too many repeated characters",
      );
    }
  }

  private static hasSequentialCharacters(password: string): boolean {
    const sequences = [
      "abcdefghijklmnopqrstuvwxyz",
      "0123456789",
      "qwertyuiop",
      "asdfghjkl",
      "zxcvbnm",
    ];

    const lowerPassword = password.toLowerCase();

    for (const sequence of sequences) {
      for (let i = 0; i < sequence.length - 2; i++) {
        const subseq = sequence.substring(i, i + 3);
        const reverseSubseq = subseq.split("").reverse().join("");

        if (
          lowerPassword.includes(subseq) ||
          lowerPassword.includes(reverseSubseq)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  private static async hash(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
      hashLength: 32,
    });
  }

  async compare(plainPassword: string): Promise<boolean> {
    if (!this._isHashed) {
      throw new DomainError(
        ErrorCode.INVALID_PASSWORD,
        "Cannot compare unhashed password",
      );
    }

    try {
      return await argon2.verify(this._hashedValue, plainPassword);
    } catch {
      return false;
    }
  }

  get value(): string {
    return this._hashedValue;
  }

  get isHashed(): boolean {
    return this._isHashed;
  }

  static calculateStrength(plainPassword: string): number {
    let score = 0;

    if (plainPassword.length >= 8) score += 10;
    if (plainPassword.length >= 16) score += 10;
    if (plainPassword.length >= 20) score += 10;

    if (/[a-z]/.test(plainPassword)) score += 10;
    if (/[A-Z]/.test(plainPassword)) score += 10;
    if (/\d/.test(plainPassword)) score += 10;
    if (/[\W_]/.test(plainPassword)) score += 10;

    const uniqueChars = new Set(plainPassword).size;
    if (uniqueChars >= plainPassword.length * 0.6) score += 15;
    if (uniqueChars >= plainPassword.length * 0.8) score += 15;

    return Math.min(score, 100);
  }

  static getStrengthLabel(score: number): string {
    if (score < 40) return "Weak";
    if (score < 60) return "Fair";
    if (score < 80) return "Good";
    return "Strong";
  }

  equals(other: Password): boolean {
    if (!other) return false;
    return this._hashedValue === other._hashedValue;
  }

  toString(): string {
    return this._hashedValue;
  }

  toJSON(): string {
    return this._hashedValue;
  }
}
