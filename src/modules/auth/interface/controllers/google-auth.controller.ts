import { type Response, type Request } from "express";
import { Controller, Get, Post, Body, Query, Res, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";

import { BaseController } from "src/core";
import { AuthFacade } from "../../application/facades/auth.facade";
import { CompleteGoogleRegistrationDto } from "../dto/google-auth.dto";

@ApiTags("Auth")
@Controller("v1/auth/google")
export class GoogleAuthController extends BaseController {
  constructor(
    private readonly authFacade: AuthFacade,
    private readonly configService: ConfigService
  ) {
    super();
  }

  @Get("authorize")
  @ApiOperation({
    summary: "Get Google OAuth authorization URL",
    description:
      "Returns the Google OAuth authorization URL to redirect the user to",
  })
  @ApiQuery({
    name: "state",
    required: false,
    description: "Optional state parameter for OAuth flow",
  })
  @ApiResponse({
    status: 302,
    description: "Redirects to Google OAuth authorization page",
  })
  authorize(@Res() res: Response, @Query("state") state?: string) {
    const url = this.authFacade.getGoogleAuthorizationUrl(state);
    res.redirect(url);
  }

  @Get("callback")
  @ApiOperation({
    summary: "Google OAuth callback",
    description:
      "Handles the Google OAuth callback. Redirects to frontend with tokens or pending registration info.",
  })
  @ApiQuery({
    name: "code",
    required: false,
    description: "Authorization code from Google",
  })
  @ApiQuery({
    name: "error",
    required: false,
    description: "Error from Google OAuth",
  })
  @ApiResponse({
    status: 302,
    description: "Redirects to frontend with authentication result",
  })
  async callback(
    @Query("code") code: string,
    @Query("error") error: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const frontendUrl =
      this.configService.get<string>("frontend.url") || "http://localhost:3001";

    if (error) {
      return res.redirect(
        `${frontendUrl}/auth/error?error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return res.redirect(
        `${frontendUrl}/auth/error?error=${encodeURIComponent("No authorization code provided")}`
      );
    }

    try {
      const deviceInfo = req.headers["user-agent"] || undefined;
      const ipAddress =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        (req.headers["x-real-ip"] as string) ||
        req.socket.remoteAddress ||
        undefined;

      const result = await this.authFacade.handleGoogleCallback({
        code,
        deviceInfo,
        ipAddress,
      });

      if (result.type === "login") {
        const params = new URLSearchParams({
          accessToken: result.accessToken!,
          refreshToken: result.refreshToken!,
        });
        res.redirect(`${frontendUrl}/auth/callback?${params}`);
      } else {
        const params = new URLSearchParams({
          pendingToken: result.pendingToken!,
          email: result.userInfo!.email,
          firstName: result.userInfo?.firstName || "",
          lastName: result.userInfo?.lastName || "",
        });
        res.redirect(`${frontendUrl}/auth/complete-registration?${params}`);
      }
    } catch (err: any) {
      const errorMessage = err.code || err.message || "GOOGLE_AUTH_FAILED";
      res.redirect(
        `${frontendUrl}/auth/error?error=${encodeURIComponent(errorMessage)}`
      );
    }
  }

  @Post("complete-registration")
  @ApiOperation({
    summary: "Complete Google OAuth registration",
    description:
      "Completes the Google OAuth registration by creating user and organization with company name",
  })
  @ApiResponse({
    status: 200,
    description: "Registration completed successfully",
    schema: {
      type: "object",
      properties: {
        accessToken: { type: "string" },
        refreshToken: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid pending token or company name",
  })
  async completeRegistration(
    @Body() dto: CompleteGoogleRegistrationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const deviceInfo = req.headers["user-agent"] || undefined;
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.headers["x-real-ip"] as string) ||
      req.socket.remoteAddress ||
      undefined;

    const result = await this.authFacade.completeGoogleSignUp({
      pendingToken: dto.pendingToken,
      companyName: dto.companyName,
      deviceInfo,
      ipAddress,
    });

    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: this.configService.get("node_env") === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: this.configService.get("node_env") === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return this.success(result);
  }
}
