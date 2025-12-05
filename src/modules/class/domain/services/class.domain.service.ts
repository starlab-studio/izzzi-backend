import { DomainError, ErrorCode } from "src/core";
import { Class } from "../entities/class.entity";

export class ClassDomainService {
  validateClassUniqueness(existingClass: Class | null): void {
    if (existingClass) {
      throw new DomainError(
        ErrorCode.CLASS_ALREADY_EXISTS,
        "A class with this name already exists in this organization",
      );
    }
  }
}
