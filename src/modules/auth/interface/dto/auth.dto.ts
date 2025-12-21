import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from "class-validator";
import { Transform } from "class-transformer";

import { ApiProperty } from "@nestjs/swagger";

import {
  SignUpData,
  SignInData,
  ForgotPasswordData,
  ResetPasswordData,
} from "../../domain/types";

export class SignUpDto implements SignUpData {
  @ApiProperty()
  @IsString({ message: "First name must be a string" })
  @MinLength(1, { message: "First name must be at least 1 characters long" })
  @MaxLength(50, { message: "First name must be at most 50 characters long" })
  @Matches(/^[A-Za-zÀ-ÖØ-öø-ÿ'-\s]+$/, {
    message:
      "First name can only contain letters, spaces, hyphens, and apostrophes",
  })
  firstName: string;

  @ApiProperty()
  @IsString({ message: "Last name must be a string" })
  @MinLength(1, { message: "Last name must be at least 1 characters long" })
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
  @MinLength(8, { message: "Password must be at least 8 characters long" })
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
  @MinLength(1, {
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

export class SignInDto implements SignInData {
  @ApiProperty()
  @IsEmail({}, { message: "Email must be a valid email address" })
  email: string;

  @ApiProperty()
  @IsString({ message: "Password must be a string" })
  @MinLength(8, { message: "Password must be at least 8 characters long" })
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
  @Transform(({ value }) => value.trim())
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: "Refresh token to get a new access token",
    example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    required: false,
  })
  @IsString({ message: "Refresh token must be a string" })
  @IsOptional()
  refreshToken?: string;
}

export class ForgotPasswordDto implements ForgotPasswordData {
  @ApiProperty({
    description: "Email address to send password reset link",
    example: "user@example.com",
  })
  @IsEmail({}, { message: "Email must be a valid email address" })
  email: string;
}

export class ResetPasswordDto implements ResetPasswordData {
  @ApiProperty({
    description: "Password reset token received via email",
    example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  })
  @IsString({ message: "Token must be a string" })
  token: string;

  @ApiProperty()
  @IsString({ message: "Password must be a string" })
  @MinLength(8, { message: "Password must be at least 8 characters long" })
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
  newPassword: string;
}
