import { IsString, IsNotEmpty, MinLength, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CompleteGoogleRegistrationDto {
  @ApiProperty({
    description: "Pending token received from Google OAuth callback",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsString()
  @IsNotEmpty()
  pendingToken: string;

  @ApiProperty({
    description: "Company name for the new organization",
    example: "Acme Corp",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: "Company name must be at least 2 characters long" })
  @MaxLength(100, {
    message: "Company name must be at most 100 characters long",
  })
  companyName: string;
}
