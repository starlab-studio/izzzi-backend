import { DomainError, ErrorCode } from "src/core";

export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(email: string): Email {
    if (!email) {
      throw new DomainError(ErrorCode.INVALID_EMAIL, "Email cannot be empty");
    }

    const normalized = this.normalize(email);
    this.validate(normalized);

    return new Email(normalized);
  }

  private static normalize(email: string): string {
    return email.trim().toLowerCase();
  }

  private static validate(email: string): void {
    const emailRegex =
      /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

    if (!emailRegex.test(email)) {
      throw new DomainError(ErrorCode.INVALID_EMAIL, "Email format is invalid");
    }

    if (email.length > 320) {
      throw new DomainError(
        ErrorCode.INVALID_EMAIL,
        "Email must not exceed 320 characters"
      );
    }

    const [localPart, domain] = email.split("@");

    if (localPart.length > 64) {
      throw new DomainError(
        ErrorCode.INVALID_EMAIL,
        "Local part of email must not exceed 64 characters"
      );
    }

    if (domain.length > 255) {
      throw new DomainError(
        ErrorCode.INVALID_EMAIL,
        "Domain part of email must not exceed 255 characters"
      );
    }

    if (email.includes("..")) {
      throw new DomainError(
        ErrorCode.INVALID_EMAIL,
        "Email cannot contain consecutive dots"
      );
    }

    if (localPart.startsWith(".") || localPart.endsWith(".")) {
      throw new DomainError(
        ErrorCode.INVALID_EMAIL,
        "Local part cannot start or end with a dot"
      );
    }
  }

  get value(): string {
    return this._value;
  }

  get localPart(): string {
    return this._value.split("@")[0];
  }

  get domain(): string {
    return this._value.split("@")[1];
  }

  isFromDomain(domain: string): boolean {
    return this.domain === domain.toLowerCase();
  }

  getMasked(): string {
    const [local, domain] = this._value.split("@");
    const [domainName, tld] = domain.split(".");

    const maskedLocal =
      local.length > 2
        ? `${local.substring(0, 2)}${"*".repeat(Math.min(local.length - 2, 3))}`
        : `${local[0]}***`;

    const maskedDomain =
      domainName.length > 2
        ? `${domainName.substring(0, 2)}${"*".repeat(Math.min(domainName.length - 2, 3))}`
        : `${domainName[0]}***`;

    return `${maskedLocal}@${maskedDomain}.${tld}`;
  }

  equals(other: Email): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }
}
