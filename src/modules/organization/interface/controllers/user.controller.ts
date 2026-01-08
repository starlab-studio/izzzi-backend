import { ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Controller, UseGuards, Get } from "@nestjs/common";

import {
  AuthGuard,
  CurrentUser,
  type JWTPayload,
  BaseController,
} from "src/core";

import { OrganizationFacade } from "../../application/facades/organization.facade";

@Controller("v1/users")
export class UserController extends BaseController {
  constructor(private readonly facade: OrganizationFacade) {
    super();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("/me")
  @ApiOperation({ summary: "Get current user profile" })
  async getCurrentOrganization(@CurrentUser() authenticatedUser: JWTPayload) {
    const response = await this.facade.getUserProfile(authenticatedUser.userId);
    return this.success(response);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("/memberships")
  @ApiOperation({ summary: "Get user memberships with organization details" })
  @ApiResponse({
    status: 200,
    description: "List of user memberships with organization details",
  })
  async getUserMemberships(@CurrentUser() authenticatedUser: JWTPayload) {
    const response = await this.facade.getUserMembershipsWithOrganizations(
      authenticatedUser.userId
    );
    return this.success(response);
  }
}
