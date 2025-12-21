import { DomainError, ErrorCode } from "src/core";

export class Color {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(input: string): Color {
    const normalized = this.normalize(input);
    this.validate(normalized);
    return new Color(normalized);
  }

  private static normalize(input: string): string {
    const s = (input ?? "").trim();
    return s.toUpperCase();
  }

  private static validate(color: string): void {
    if (!color) {
      throw new DomainError(
        ErrorCode.INVALID_SUBJECT_COLOR,
        "La couleur du sujet est obligatoire",
      );
    }
    const hexRegex = /^#[0-9A-F]{6}$/;
    if (!hexRegex.test(color)) {
      throw new DomainError(
        ErrorCode.INVALID_SUBJECT_COLOR,
        "La couleur doit être au format hexadécimal (#RRGGBB)",
      );
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: Color): boolean {
    return !!other && this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }
}
