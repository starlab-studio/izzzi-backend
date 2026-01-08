import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEmail, IsEnum } from "class-validator";

import { UserRole } from "src/core";

export class InvitationDto {
  @ApiProperty({
    description: "Email address of the user to invite",
    example: "user@example.com",
  })
  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: "Email must be a valid email address" })
  email: string;

  @ApiProperty({
    description: "Role to assign to the invited user",
    enum: UserRole,
    example: UserRole.LEARNING_MANAGER,
  })
  @IsNotEmpty({ message: "Role is required" })
  @IsEnum(UserRole, { message: "Role must be a valid UserRole" })
  role: UserRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: "New role to assign to the member",
    enum: UserRole,
    example: UserRole.LEARNING_MANAGER,
  })
  @IsNotEmpty({ message: "Role is required" })
  @IsEnum(UserRole, { message: "Role must be a valid UserRole" })
  role: UserRole;
}
