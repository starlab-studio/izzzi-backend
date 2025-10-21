import { DomainError, ErrorCode } from "src/core";
import { IOrganization } from "../types";

export class OrganizationDomainService {
  cleanString(input: string): string {
    if (!input) return "";

    return input
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[\u00A0\u2000-\u200B\u2028\u2029\u3000]/g, " ");
  }

  validateOrganizationUniqueness(organization: IOrganization | null): void {
    if (organization) {
      throw new DomainError(
        ErrorCode.ORGANIZATION_ALREADY_EXIST,
        "Organization name is not available"
      );
    }
  }

  validateSlugUniqueness(existingOrganization: IOrganization | null): void {
    if (existingOrganization) {
      throw new DomainError(
        ErrorCode.ORGANIZATION_SLUG_ALREADY_EXISTS,
        "Organization slug is already taken"
      );
    }
  }

  validateOrganizationConsistency(data: IOrganization | null): void {
    const cleanSiren = data?.siren && data.siren.replace(/[\s\-]/g, "");
    const cleanSiret = data?.siret && data.siret.replace(/[\s\-]/g, "");

    if (cleanSiren && cleanSiret && !cleanSiret.startsWith(cleanSiren)) {
      throw new DomainError(
        ErrorCode.INCONSISTENT_ORGANIZATION_DATA,
        "SIRET must start with the SIREN"
      );
    }
  }

  async generateUniqueSlug(
    name: string,
    checkUniqueness: (slug: string) => Promise<IOrganization | null>
  ): Promise<string> {
    const baseSlug = this.generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    let existingOrg = await checkUniqueness(slug);

    while (existingOrg) {
      slug = `${baseSlug}-${counter}`;
      existingOrg = await checkUniqueness(slug);
      counter++;

      if (counter > 999) {
        throw new DomainError(
          ErrorCode.SLUG_GENERATION_FAILED,
          "Unable to generate unique slug after 999 attempts"
        );
      }
    }

    return slug;
  }

  private generateSlug(name: string): string {
    if (!name || name.trim().length === 0) {
      throw new DomainError(
        ErrorCode.INVALID_ORGANIZATION_NAME,
        "Organization name is required to generate slug"
      );
    }

    return name
      .toLowerCase()
      .trim()
      .replace(/[àáâãäå]/g, "a")
      .replace(/[èéêë]/g, "e")
      .replace(/[ìíîï]/g, "i")
      .replace(/[òóôõö]/g, "o")
      .replace(/[ùúûü]/g, "u")
      .replace(/[ýÿ]/g, "y")
      .replace(/[ç]/g, "c")
      .replace(/[ñ]/g, "n")
      .replace(/[ß]/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);
  }

  validateGeneratedSlug(slug: string): void {
    if (!slug || slug.length === 0) {
      throw new DomainError(
        ErrorCode.INVALID_ORGANIZATION_SLUG,
        "Generated slug is empty"
      );
    }

    if (slug.length > 50) {
      throw new DomainError(
        ErrorCode.INVALID_ORGANIZATION_SLUG,
        "Generated slug exceeds maximum length"
      );
    }

    if (slug.startsWith("-") || slug.endsWith("-")) {
      throw new DomainError(
        ErrorCode.INVALID_ORGANIZATION_SLUG,
        "Generated slug cannot start or end with a hyphen"
      );
    }

    const validSlugRegex = /^[a-z0-9\-]+$/;
    if (!validSlugRegex.test(slug)) {
      throw new DomainError(
        ErrorCode.INVALID_ORGANIZATION_SLUG,
        "Generated slug contains invalid characters"
      );
    }
  }
}
