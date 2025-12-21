import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsOptional,
} from "class-validator";

export class AcceptInvitationDto {
  @ApiProperty({
    description: "Invitation token received via email",
    example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  })
  @IsNotEmpty({ message: "Token is required" })
  @IsString({ message: "Token must be a string" })
  token: string;
}

export class SignUpFromInvitationDto {
  @ApiProperty({
    description: "Invitation token received via email",
    example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  })
  @IsNotEmpty({ message: "Token is required" })
  @IsString({ message: "Token must be a string" })
  token: string;

  @ApiProperty({
    description: "First name",
    example: "John",
  })
  @IsNotEmpty({ message: "First name is required" })
  @IsString({ message: "First name must be a string" })
  @MinLength(1, { message: "First name must be at least 1 character long" })
  @MaxLength(50, { message: "First name must be at most 50 characters long" })
  @Matches(/^[A-Za-zÀ-ÖØ-öø-ÿ'-\s]+$/, {
    message:
      "First name can only contain letters, spaces, hyphens, and apostrophes",
  })
  firstName: string;

  @ApiProperty({
    description: "Last name",
    example: "Doe",
  })
  @IsNotEmpty({ message: "Last name is required" })
  @IsString({ message: "Last name must be a string" })
  @MinLength(1, { message: "Last name must be at least 1 character long" })
  @MaxLength(50, { message: "Last name must be at most 50 characters long" })
  @Matches(/^[A-Za-zÀ-ÖØ-öø-ÿ'-\s]+$/, {
    message:
      "Last name can only contain letters, spaces, hyphens, and apostrophes",
  })
  lastName: string;

  @ApiProperty({
    description:
      "Email address (optional, can be pre-filled from invitation validation). Must match the invitation email.",
    example: "user@example.com",
    required: false,
  })
  @IsEmail({}, { message: "Email must be a valid email address" })
  email: string;

  @ApiProperty({
    description: "Password",
    example: "SecureP@ssw0rd123",
  })
  @IsNotEmpty({ message: "Password is required" })
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
}
