import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, UseGuards, Get } from "@nestjs/common";

import {
  AuthGuard,
  UserRole,
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
  async getCurrentOrganization(@CurrentUser() authenticatedUser: JWTPayload) {
    const response = await this.facade.getUserProfile(authenticatedUser.userId);
    return this.success(response);
  }
}
