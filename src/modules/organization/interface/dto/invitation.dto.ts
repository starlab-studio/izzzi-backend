import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEmail, IsString } from "class-validator";

import { UserRole } from "src/core";

export class InvitationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail({}, { message: "Email must be a valid email address" })
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  role: UserRole;
}
