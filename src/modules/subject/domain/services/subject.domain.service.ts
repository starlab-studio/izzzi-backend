import { DomainError } from "src/core";
import { ISubject, ISubjectCreate } from "../types";

export class SubjectDomainService {
  validateSubjectData(data: ISubjectCreate): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new DomainError(
        "INVALID_SUBJECT_NAME",
        "Le nom du sujet est obligatoire",
      );
    }

    if (data.name.trim().length < 1) {
      throw new DomainError(
        "INVALID_SUBJECT_NAME",
        "Le nom du sujet doit contenir au moins 1 caractère",
      );
    }

    if (!data.color || data.color.trim().length === 0) {
      throw new DomainError(
        "INVALID_SUBJECT_COLOR",
        "La couleur du sujet est obligatoire",
      );
    }

    const color = data.color.trim();
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(color)) {
      throw new DomainError(
        "INVALID_SUBJECT_COLOR",
        "La couleur doit être au format hexadécimal (#RRGGBB)",
      );
    }

    if (!data.organizationId || data.organizationId.trim().length === 0) {
      throw new DomainError(
        "INVALID_SUBJECT_ORGANIZATION",
        "L'organisation est obligatoire",
      );
    }

    if (!data.userId || data.userId.trim().length === 0) {
      throw new DomainError(
        "INVALID_SUBJECT_USER",
        "L'utilisateur est obligatoire",
      );
    }
  }

  validateSubjectUniqueness(existingSubject: ISubject | null): void {
    if (existingSubject) {
      throw new DomainError(
        "SUBJECT_ALREADY_EXISTS",
        "Un sujet avec ce nom existe déjà dans cette organisation",
      );
    }
  }

  validateSubjectExists(existingSubject: ISubject | null): void {
    if (!existingSubject) {
      throw new DomainError("SUBJECT_NOT_FOUND", "Sujet non trouvé");
    }
  }
}
