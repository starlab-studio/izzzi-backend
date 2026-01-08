import { DomainError } from "../errors/domain.error";

export abstract class BaseEntity {
  protected static validateRequiredString(
    value: string,
    fieldName: string,
    errorCode?: string,
  ): void {
    if (!value || value.trim().length === 0) {
      throw new DomainError(
        errorCode || this.toErrorCode(fieldName),
        `${fieldName} is required`,
      );
    }
  }

  protected static validateMinLength(
    value: string,
    minLength: number,
    fieldName: string,
    errorCode?: string,
  ): void {
    if (value.length < minLength) {
      throw new DomainError(
        errorCode || this.toErrorCode(fieldName),
        `${fieldName} must be at least ${minLength} characters`,
      );
    }
  }

  protected static validateMaxLength(
    value: string,
    maxLength: number,
    fieldName: string,
    errorCode?: string,
  ): void {
    if (value.length > maxLength) {
      throw new DomainError(
        errorCode || this.toErrorCode(fieldName),
        `${fieldName} must not exceed ${maxLength} characters`,
      );
    }
  }

  private static toErrorCode(fieldName: string): string {
    return fieldName.toUpperCase().replace(/\s+/g, "_");
  }
}
