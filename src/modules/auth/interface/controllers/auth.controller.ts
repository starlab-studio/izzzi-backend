import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { BaseController, AuthGuard, CurrentUser } from "src/core";
import { AuthFacade } from "../../application/facades/auth.facade";
import { SignInDto, SignUpDto } from "../dto/auth.dto";
import { ConfirmEmailDto } from "../dto/verification.dto";
import { type JWTPayload } from "../../infrastructure/factories/custom.adapter";

@ApiTags("auth")
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

  @Post("confirm-email")
  async confirmEmail(@Body() dto: ConfirmEmailDto) {
    const result = await this.authFacade.confirmEmail(dto);
    return this.success(result);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("me")
  async getCurrentUserProfile(@CurrentUser() authenticatedUser: JWTPayload) {
    return { data: authenticatedUser };
  }
}
