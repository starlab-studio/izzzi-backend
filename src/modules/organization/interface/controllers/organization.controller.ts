import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiTags,
} from "@nestjs/swagger";
import { Controller, UseGuards, Get, Post, Param, Body } from "@nestjs/common";

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
  constructor(private readonly organizationFacade: OrganizationFacade) {
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
}
