import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Get, Put, Delete, Body, UseGuards } from "@nestjs/common";

import { BaseController, AuthGuard, RolesGuard, Roles, CurrentUser, UserRole } from "src/core";
import type { JWTPayload } from "src/core";
import { UserFacade } from "../../application/facades/user.facade";
import { UpdateProfileDto } from "../dto/profile.dto";
import { AuthFacade } from "../../../auth/application/facades/auth.facade";
import { ChangePasswordDto } from "../../../auth/interface/dto/auth.dto";

@ApiTags("Profile")
@Controller("v1/profile")
export class ProfileController extends BaseController {
  constructor(
    private readonly userFacade: UserFacade,
    private readonly authFacade: AuthFacade
  ) {
    super();
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: "Récupérer le profil de l'utilisateur connecté",
    description: "Récupère les informations du profil de l'utilisateur authentifié",
  })
  @ApiResponse({
    status: 200,
    description: "Profil récupéré avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 404, description: "Utilisateur non trouvé" })
  async getProfile(@CurrentUser() user: JWTPayload) {
    const profile = await this.userFacade.getProfile({ userId: user.userId });
    return this.success(profile);
  }

  @Put()
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LEARNING_MANAGER)
  @ApiOperation({
    summary: "Mettre à jour le profil de l'utilisateur connecté",
    description:
      "Met à jour les informations du profil (prénom, nom, email, nom de l'établissement) de l'utilisateur authentifié. Seul un admin peut mettre à jour le nom de l'établissement.",
  })
  @ApiResponse({
    status: 200,
    description: "Profil mis à jour avec succès",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit - Admin requis pour modifier le nom de l'établissement" })
  @ApiResponse({ status: 404, description: "Utilisateur non trouvé" })
  async updateProfile(
    @CurrentUser() user: JWTPayload,
    @Body() dto: UpdateProfileDto
  ) {
    const updatedProfile = await this.userFacade.updateProfile({
      userId: user.userId,
      firstName: dto.firstname,
      lastName: dto.lastname,
      email: dto.email,
      organizationId: dto.organizationId,
      organizationName: dto.organizationName,
    });
    return this.success(updatedProfile);
  }

  @Put("password")
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: "Changer le mot de passe",
    description:
      "Change le mot de passe de l'utilisateur authentifié. Nécessite l'ancien mot de passe et le nouveau mot de passe.",
  })
  @ApiResponse({
    status: 200,
    description: "Mot de passe modifié avec succès",
  })
  @ApiResponse({ status: 400, description: "Mot de passe invalide" })
  @ApiResponse({
    status: 401,
    description: "Non autorisé ou ancien mot de passe invalide",
  })
  async changePassword(
    @CurrentUser() user: JWTPayload,
    @Body() dto: ChangePasswordDto
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

  @Delete()
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: "Supprimer le compte (Admin uniquement)",
    description:
      "Supprime définitivement le compte de l'utilisateur admin authentifié, son organisation et toutes les données associées. Les utilisateurs uniquement liés à cette organisation seront également supprimés.",
  })
  @ApiResponse({
    status: 200,
    description: "Compte et données associées supprimés avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit - Admin requis" })
  @ApiResponse({ status: 404, description: "Utilisateur non trouvé" })
  async deleteAccount(@CurrentUser() user: JWTPayload) {
    await this.userFacade.deleteAccount({ userId: user.userId });
    return this.success({
      message: "Account has been deleted successfully",
    });
  }
}

