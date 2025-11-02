import { Controller, Post, Body } from "@nestjs/common";

import { BaseController } from "src/core/interfaces/controller/base.controller";
import { AuthFacade } from "../../application/facades/auth.facade";
import { SignInDto, SignUpDto } from "../dto/auth.dto";

@Controller("v1/auth")
export class AuthController extends BaseController {
  constructor(private readonly authFacade: AuthFacade) {
    super();
  }

  @Post("signup")
  async signUp(@Body() dto: SignUpDto) {
    const authIdentity = await this.authFacade.signUp(dto);
    return this.success(authIdentity);
  }

  @Post("signin")
  async signIn(@Body() dto: SignInDto) {
    const authIdentity = await this.authFacade.signIn(dto);
    return this.success(authIdentity);
  }
}
