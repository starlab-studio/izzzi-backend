import { ApiBearerAuth } from "@nestjs/swagger";
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

@Controller("v1/organizations")
export class OrganizationController extends BaseController {
  constructor(private readonly organizationFacade: OrganizationFacade) {
    super();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("/:organizationId/invitations")
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
