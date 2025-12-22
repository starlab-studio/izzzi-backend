import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiTags,
} from "@nestjs/swagger";
import {
  Controller,
  UseGuards,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { ConfigService } from "@nestjs/config";

import {
  AuthGuard,
  RolesGuard,
  CurrentUser,
  Roles,
  UserRole,
  type JWTPayload,
  BaseController,
} from "src/core";
import { InvitationDto } from "../dto/invitation.dto";
import { OrganizationFacade } from "../../application/facades/organization.facade";

@ApiTags("Organizations")
@Controller("v1/organizations")
export class OrganizationController extends BaseController {
  constructor(
    private readonly organizationFacade: OrganizationFacade,
    private readonly configService: ConfigService
  ) {
    super();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("/:organizationId/invitations")
  @ApiOperation({
    summary: "Send invitation to join organization",
    description:
      "Send an invitation email to a user to join the organization. Only ADMIN role can send invitations.",
  })
  @ApiParam({
    name: "organizationId",
    description: "Organization ID",
    type: String,
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: InvitationDto })
  @ApiResponse({
    status: 201,
    description: "Invitation sent successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string" },
        organizationId: { type: "string" },
        role: { type: "string", enum: Object.values(UserRole) },
        invitedBy: { type: "string" },
        token: { type: "string" },
        acceptedAt: { type: "string", nullable: true },
        createdAt: { type: "string" },
        updatedAt: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User does not have ADMIN role",
  })
  @ApiResponse({
    status: 404,
    description: "Organization or inviter not found",
  })
  @ApiResponse({
    status: 409,
    description: "User is already a member or invitation already sent",
  })
  async sendInvitation(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Body() dto: InvitationDto,
    @Param("organizationId") organizationId: string
  ) {
    const response = await this.organizationFacade.sendUserInvitation({
      ...dto,
      invitedBy: authenticatedUser.userId,
      organizationId,
    });

    return this.success(response);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LEARNING_MANAGER)
  @Get("/:organizationId")
  async getOneOrganization(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Param("organizationId") organizationId: string
  ) {
    const userId = authenticatedUser.userId;
    const response = await this.organizationFacade.getOneOrganization(
      organizationId,
      userId
    );
    return this.success(response);
  }

  @Get("/invitations/validate")
  @ApiOperation({
    summary: "Validate invitation token",
    description:
      "Validate an invitation token and return invitation details. Used by frontend to determine the flow (signup vs login vs accept).",
  })
  @ApiQuery({
    name: "token",
    description: "Invitation token",
    type: String,
    example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Invitation validated successfully",
    schema: {
      type: "object",
      properties: {
        invitation: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            organizationId: { type: "string" },
            role: { type: "string" },
          },
        },
        userExists: { type: "boolean" },
        userEmail: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid or expired invitation" })
  @ApiResponse({ status: 404, description: "Invitation not found" })
  async validateInvitation(@Query("token") token: string) {
    const response = await this.organizationFacade.validateInvitation({
      token,
    });
    return this.success(response);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post("/invitations/accept")
  @ApiOperation({
    summary: "Accept invitation",
    description:
      "Accept an organization invitation. User must be authenticated and the invitation email must match the authenticated user's email.",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "Invitation token",
          example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
        },
      },
      required: ["token"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Invitation accepted successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid or expired invitation" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Invitation email does not match user email",
  })
  @ApiResponse({ status: 404, description: "Invitation or user not found" })
  async acceptInvitation(
    @Body() body: { token: string },
    @CurrentUser() user: JWTPayload,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.organizationFacade.acceptInvitation({
      token: body.token,
      userId: user.userId,
    });

    // Update access_token cookie with new token containing updated memberships
    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: this.configService.get("node_env") === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    });

    return this.success({
      message: "Invitation accepted successfully",
      accessToken: result.accessToken,
    });
  }
}
