import { IsString, IsNotEmpty, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

import { ConfirmSignUpData } from "../../domain/types";

export class ConfirmEmailDto implements ConfirmSignUpData {
  @ApiProperty({
    description: "Verification code received via email",
  })
  @IsString({ message: "Token must be a string" })
  @IsNotEmpty({ message: "Verification token is required" })
  token: string;
}
