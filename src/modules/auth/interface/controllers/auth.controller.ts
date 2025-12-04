import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Res,
} from "@nestjs/common";
import { type Response } from "express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";

import {
  BaseController,
  AuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
} from "src/core";
import { AuthFacade } from "../../application/facades/auth.facade";
import { SignInDto, SignUpDto } from "../dto/auth.dto";
import { ConfirmEmailDto } from "../dto/verification.dto";
import { type JWTPayload } from "../../infrastructure/factories/custom.adapter";
import { Role } from "src/modules/organization";

@ApiTags("auth")
@Controller("v1/auth")
export class AuthController extends BaseController {
  constructor(
    private readonly authFacade: AuthFacade,
    private readonly configService: ConfigService
  ) {
    super();
  }

  @Post("signup")
  async signUp(@Body() dto: SignUpDto) {
    const authIdentity = await this.authFacade.signUp(dto);
    return this.success(authIdentity);
  }

  @Post("signin")
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const authIdentity = await this.authFacade.signIn(dto);

    res.cookie("access_token", authIdentity.accessToken, {
      httpOnly: true,
      secure: this.configService.get("node_env") === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.cookie("refresh_token", authIdentity.refreshToken, {
      httpOnly: true,
      secure: this.configService.get("node_env") === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/v1/auth/refresh",
    });

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

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.MEMBER)
  @Get("me/orgs/:organizationId")
  async getCurrentOrganization(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Param("organizationId") organizationId: string
  ) {
    return { data: authenticatedUser };
  }
}
