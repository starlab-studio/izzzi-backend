import { Controller, Post, Body } from "@nestjs/common";

import { AuthService } from "../../application/services/auth.service";
import { SignUpDto } from "../dto/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post("signUp")
  async signUp(@Body() dto: SignUpDto) {
    const authIdentity = await this.service.signUp(dto);
    return authIdentity;
  }
}
