import { type Response, type Request } from "express";
import { ApiTags, ApiResponse, ApiOperation, ApiBody } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { Controller, Post, Body, Res, Req, UseGuards } from "@nestjs/common";

import { BaseController } from "src/core";
import { AuthFacade } from "../../application/facades/auth.facade";
import { SignInDto, SignUpDto, RefreshTokenDto } from "../dto/auth.dto";
import { ConfirmEmailDto } from "../dto/verification.dto";
import { RefreshTokenGuard } from "src/core/interfaces/guards/refreshToken.guard";
import { RefreshToken } from "src/core/interfaces/decorators/refreshToken.decorator";

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
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const deviceInfo = req.headers["user-agent"] || undefined;
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.headers["x-real-ip"] as string) ||
      req.socket.remoteAddress ||
      undefined;

    const authIdentity = await this.authFacade.signIn({
      ...dto,
      deviceInfo,
      ipAddress,
    });

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

  @Post("refresh-token")
  @UseGuards(RefreshTokenGuard)
  @ApiOperation({
    summary: "Refresh access token",
    description:
      "Get a new access token using a refresh token. The refresh token can be sent in the request body, cookie, or x-refresh-token header.",
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: "Refresh token (optional if sent via cookie or header)",
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Successfully refreshed access token",
    schema: {
      type: "object",
      properties: {
        accessToken: { type: "string" },
        refreshToken: { type: "string", nullable: true },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Refresh token is required" })
  @ApiResponse({ status: 401, description: "Invalid or expired refresh token" })
  async refreshAccessToken(
    @RefreshToken() refreshToken: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const deviceInfo = req.headers["user-agent"] || undefined;
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.headers["x-real-ip"] as string) ||
      req.socket.remoteAddress ||
      undefined;

    const authIdentity = await this.authFacade.refreshAccessToken({
      refreshToken,
      deviceInfo,
      ipAddress,
    });

    res.cookie("access_token", authIdentity.accessToken, {
      httpOnly: true,
      secure: this.configService.get("node_env") === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    return this.success(authIdentity);
  }

  @Post("confirm-email")
  async confirmEmail(@Body() dto: ConfirmEmailDto) {
    const result = await this.authFacade.confirmEmail(dto);
    return this.success(result);
  }
}
