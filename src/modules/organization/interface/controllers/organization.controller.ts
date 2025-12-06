import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, UseGuards, Post, Param, Body } from "@nestjs/common";

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
import { SendInvitationUseCase } from "../../application/use-cases/send-invitation.use-case";

@Controller("v1/organizations")
export class OrganizationController extends BaseController {
  constructor(private readonly sendInvitationUseCase: SendInvitationUseCase) {
    super();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.LEARNING_MANAGER)
  @Post(":organization_id/invitations")
  async sendInvitation(
    @CurrentUser() authenticatedUser: JWTPayload,
    @Body() dto: InvitationDto,
    @Param("organization_id") organizationId: string
  ) {
    const response = await this.sendInvitationUseCase.execute({
      ...dto,
      invitedBy: authenticatedUser.userId,
      organizationId,
    });

    return this.success(response);
  }
}
