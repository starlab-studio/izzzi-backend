import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";

import { ApiProperty } from "@nestjs/swagger";

import { SignUpData } from "../../domain/types";

export class SignUpDto implements SignUpData {
  @ApiProperty()
  @IsString({ message: "First name must be a string" })
  @MinLength(2, { message: "First name must be at least 2 characters long" })
  @MaxLength(50, { message: "First name must be at most 50 characters long" })
  @Matches(/^[A-Za-zÀ-ÖØ-öø-ÿ'-\s]+$/, {
    message:
      "First name can only contain letters, spaces, hyphens, and apostrophes",
  })
  firstName: string;

  @ApiProperty()
  @IsString({ message: "Last name must be a string" })
  @MinLength(2, { message: "Last name must be at least 2 characters long" })
  @MaxLength(50, { message: "Last name must be at most 50 characters long" })
  @Matches(/^[A-Za-zÀ-ÖØ-öø-ÿ'-\s]+$/, {
    message:
      "Last name can only contain letters, spaces, hyphens, and apostrophes",
  })
  lastName: string;

  @ApiProperty()
  @IsEmail({}, { message: "Email must be a valid email address" })
  email: string;

  @ApiProperty()
  @IsString({ message: "Password must be a string" })
  @MinLength(12, { message: "Password must be at least 12 characters long" })
  @MaxLength(128, { message: "Password must be at most 128 characters long" })
  @Matches(/(?=.*[a-z])/, {
    message: "Password must contain at least one lowercase letter",
  })
  @Matches(/(?=.*[A-Z])/, {
    message: "Password must contain at least one uppercase letter",
  })
  @Matches(/(?=.*\d)/, { message: "Password must contain at least one number" })
  @Matches(/(?=.*[\W_])/, {
    message: "Password must contain at least one special character",
  })
  password: string;

  @ApiProperty()
  @IsString({ message: "Organization name must be a string" })
  @MinLength(2, {
    message: "Organization name must be at least 2 characters long",
  })
  @MaxLength(50, {
    message: "Organization name must be at most 50 characters long",
  })
  @Matches(/^[A-Za-zÀ-ÖØ-öø-ÿ'-\s]+$/, {
    message:
      "Organization name can only contain letters, spaces, hyphens, and apostrophes",
  })
  organization: string;
}
