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
  Patch,
  Delete,
  Param,
  Body,
  Query,
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
import { InvitationDto, UpdateMemberRoleDto } from "../dto/invitation.dto";
import { OrganizationFacade } from "../../application/facades/organization.facade";
import { AuthFacade } from "src/modules/auth/application/facades/auth.facade";

@ApiTags("Organizations")
@Controller("v1/organizations")
export class OrganizationController extends BaseController {
  constructor(
    private readonly organizationFacade: OrganizationFacade,
    private readonly authFacade: AuthFacade,
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
    await this.organizationFacade.acceptInvitation({
      token: body.token,
      userId: user.userId,
    });

    const accessToken = await this.authFacade.generateAccessTokenForUser(
      user.userId
    );

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: this.configService.get("node_env") === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    return this.success({
      message: "Invitation accepted successfully",
      accessToken,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("/:organizationId/members")
  @ApiOperation({
    summary: "Get organization members",
    description:
      "Get all active members of an organization with their user details.",
  })
  @ApiParam({
    name: "organizationId",
    description: "Organization ID",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Members retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - User is not admin" })
  async getOrganizationMembers(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Param("organizationId") organizationId: string
  ) {
    const response = await this.organizationFacade.getOrganizationMembers({
      organizationId,
      requesterId: authenticatedUser.userId,
    });
    return this.success(response);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("/:organizationId/stats")
  @ApiOperation({
    summary: "Get organization statistics",
    description:
      "Get statistics for an organization including user count, class count, quiz count, and feedback count.",
  })
  @ApiParam({
    name: "organizationId",
    description: "Organization ID",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - User is not admin" })
  async getOrganizationStats(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Param("organizationId") organizationId: string
  ) {
    const response = await this.organizationFacade.getOrganizationStats({
      organizationId,
      requesterId: authenticatedUser.userId,
    });
    return this.success(response);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("/:organizationId/members/:membershipId/role")
  @ApiOperation({
    summary: "Update member role",
    description:
      "Update the role of a member in the organization. Only admin can perform this action.",
  })
  @ApiParam({
    name: "organizationId",
    description: "Organization ID",
    type: String,
  })
  @ApiParam({
    name: "membershipId",
    description: "Membership ID",
    type: String,
  })
  @ApiBody({ type: UpdateMemberRoleDto })
  @ApiResponse({
    status: 200,
    description: "Member role updated successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not admin or trying to change own role",
  })
  @ApiResponse({ status: 404, description: "Membership not found" })
  async updateMemberRole(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Param("organizationId") organizationId: string,
    @Param("membershipId") membershipId: string,
    @Body() dto: UpdateMemberRoleDto
  ) {
    await this.organizationFacade.updateMemberRole({
      membershipId,
      organizationId,
      newRole: dto.role,
      requesterId: authenticatedUser.userId,
    });
    return this.success({ message: "Member role updated successfully" });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete("/:organizationId/members/:membershipId")
  @ApiOperation({
    summary: "Remove member from organization",
    description:
      "Remove a member from the organization. Only admin can perform this action.",
  })
  @ApiParam({
    name: "organizationId",
    description: "Organization ID",
    type: String,
  })
  @ApiParam({
    name: "membershipId",
    description: "Membership ID",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Member removed successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not admin or trying to remove self",
  })
  @ApiResponse({ status: 404, description: "Membership not found" })
  async removeMember(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Param("organizationId") organizationId: string,
    @Param("membershipId") membershipId: string
  ) {
    await this.organizationFacade.removeMember({
      membershipId,
      organizationId,
      requesterId: authenticatedUser.userId,
    });
    return this.success({ message: "Member removed successfully" });
  }
}
