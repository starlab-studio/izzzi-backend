import { type Response, type Request } from "express";
import { ApiTags, ApiResponse, ApiOperation, ApiBody } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
} from "@nestjs/common";

import { BaseController, AuthGuard, CurrentUser } from "src/core";
import type { JWTPayload } from "src/core";
import { AuthFacade } from "../../application/facades/auth.facade";

import {
  SignInDto,
  SignUpDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from "../dto/auth.dto";
import { SignUpFromInvitationDto } from "../dto/invitation.dto";
import { ConfirmEmailDto } from "../dto/verification.dto";
import { RefreshTokenGuard } from "src/core/interfaces/guards/refreshToken.guard";
import { RefreshToken } from "src/core/interfaces/decorators/refreshToken.decorator";

@ApiTags("Auth")
@Controller("v1/auth")
export class AuthController extends BaseController {
  constructor(
    private readonly authFacade: AuthFacade,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  @Post("signup")
  @ApiOperation({
    summary: "Sign up",
    description: "Create a new account and organization.",
  })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: 201,
    description: "Account created successfully",
  })
  async signUp(@Body() dto: SignUpDto) {
    const authIdentity = await this.authFacade.signUp(dto);
    return this.success(authIdentity);
  }

  @Post("signup-from-invitation")
  @ApiOperation({
    summary: "Sign up from invitation",
    description:
      "Create a new account from an invitation token. The email is automatically verified and a welcome email is sent. No organization is created.",
  })
  @ApiBody({ type: SignUpFromInvitationDto })
  @ApiResponse({
    status: 201,
    description: "Account created and invitation accepted successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid or expired invitation" })
  @ApiResponse({ status: 404, description: "Invitation not found" })
  @ApiResponse({ status: 409, description: "User already exists" })
  async signUpFromInvitation(@Body() dto: SignUpFromInvitationDto) {
    const response = await this.authFacade.signUpFromInvitation({
      token: dto.token,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: dto.password,
    });
    return this.success(response);
  }

  @Post("signin")
  async signIn(
    @Body() dto: SignInDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
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
      path: "/",
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
    @Res({ passthrough: true }) res: Response,
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

    res.cookie("refresh_token", authIdentity.refreshToken, {
      httpOnly: true,
      secure: this.configService.get("node_env") === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return this.success(authIdentity);
  }

  @Post("confirm-email")
  async confirmEmail(@Body() dto: ConfirmEmailDto) {
    const result = await this.authFacade.confirmEmail(dto);
    return this.success(result);
  }

  @Post("password/forgot")
  @ApiOperation({
    summary: "Request password reset",
    description: "Send a password reset link to the user's email address",
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description:
      "Password reset email sent successfully (always returns success for security)",
  })
  @ApiResponse({ status: 400, description: "Invalid email address" })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authFacade.forgotPassword(dto);
    return this.success({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  }

  @Post("password/reset")
  @ApiOperation({
    summary: "Reset password",
    description: "Reset password using the token received via email",
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: "Password reset successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid token or password" })
  @ApiResponse({ status: 401, description: "Token expired or already used" })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authFacade.resetPassword(dto);
    return this.success({
      message: "Password has been reset successfully",
    });
  }

  @Post("password/change")
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: "Change password",
    description:
      "Change password for authenticated user. Requires current password and new password.",
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: "Password changed successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid password" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized or invalid current password",
  })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: JWTPayload,
  ) {
    await this.authFacade.changePassword({
      userId: user.userId,
      username: user.username,
      oldPassword: dto.oldPassword,
      newPassword: dto.newPassword,
    });
    return this.success({
      message: "Password has been changed successfully",
    });
  }

  @Post("logout")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: "Logout",
    description: "Revoke refresh token and clear authentication cookies.",
  })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async logout(
    @CurrentUser() user: JWTPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authFacade.revokeAllRefreshTokens(user.userId);

    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/" });

    return this.success({
      message: "Logged out successfully",
    });
  }

  @Get("providers")
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: "Get user providers",
    description:
      "Returns the authentication providers linked to the current user's account",
  })
  @ApiResponse({
    status: 200,
    description: "Providers retrieved successfully",
    schema: {
      type: "object",
      properties: {
        providers: {
          type: "array",
          items: { type: "string" },
          example: ["CUSTOM", "GOOGLE"],
        },
        canChangePassword: { type: "boolean", example: true },
        canLinkGoogle: { type: "boolean", example: false },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProviders(@CurrentUser() user: JWTPayload) {
    const providers = await this.authFacade.getUserProviders(user.userId);
    return this.success(providers);
  }
}
