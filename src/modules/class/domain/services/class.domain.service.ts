import { DomainError, ErrorCode } from "src/core";
import { IClass, IClassCreate } from "../types";

export class ClassDomainService {
  validateClassData(data: IClassCreate): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new DomainError(
        ErrorCode.INVALID_CLASS_NAME,
        "Le nom de la classe est obligatoire",
      );
    }

    if (data.name.trim().length < 1) {
      throw new DomainError(
        ErrorCode.INVALID_CLASS_NAME,
        "Le nom de la classe doit contenir au moins 1 caractère",
      );
    }

    if (data.numberOfStudents === undefined || data.numberOfStudents === null) {
      throw new DomainError(
        ErrorCode.INVALID_STUDENT_COUNT,
        "Le nombre d'étudiants est obligatoire",
      );
    }

    if (
      !Number.isInteger(data.numberOfStudents) ||
      data.numberOfStudents <= 0
    ) {
      throw new DomainError(
        ErrorCode.INVALID_STUDENT_COUNT,
        "Le nombre d'étudiants doit être un nombre entier supérieur à 0",
      );
    }

    if (!data.studentEmails || data.studentEmails.trim().length === 0) {
      throw new DomainError(
        ErrorCode.INVALID_STUDENT_EMAILS,
        "Les adresses email des étudiants sont obligatoires",
      );
    }

    const emails = this.parseEmails(data.studentEmails);
    if (emails.length === 0) {
      throw new DomainError(
        ErrorCode.INVALID_STUDENT_EMAILS,
        "Au moins une adresse email valide est requise",
      );
    }

    if (emails.length !== data.numberOfStudents) {
      throw new DomainError(
        ErrorCode.EMAIL_COUNT_MISMATCH,
        `Le nombre d'emails (${emails.length}) ne correspond pas au nombre d'étudiants (${data.numberOfStudents})`,
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (!emailRegex.test(email.trim())) {
        throw new DomainError(
          ErrorCode.INVALID_STUDENT_EMAILS,
          `L'adresse email "${email}" n'est pas valide`,
        );
      }
    }
  }

  validateClassUniqueness(existingClass: IClass | null): void {
    if (existingClass) {
      throw new DomainError(
        ErrorCode.CLASS_ALREADY_EXISTS,
        "Une classe avec ce nom existe déjà dans cette organisation",
      );
    }
  }

  parseEmails(emailsString: string): string[] {
    return emailsString
      .split(";")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  }

  validateClassExists(existingClass: IClass | null): void {
    if (!existingClass) {
      throw new DomainError(ErrorCode.CLASS_NOT_FOUND, "Classe non trouvée");
    }
  }
  // TODO: Validation limite d'abonnement
}
