import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { BaseController, AuthGuard, CurrentUser } from "src/core";
import type { JWTPayload } from "src/core";
import { ContactFacade } from "../../application/facades/contact.facade";
import {
  CreateContactRequestDto,
  UpdateContactRequestDto,
  ContactRequestQueryDto,
  SendContactReplyDto,
} from "../dto/contact-request.dto";
import { SuperAdminGuard } from "../../guards/super-admin.guard";

@ApiTags("Contact")
@Controller("v1/contact")
export class ContactController extends BaseController {
  constructor(private readonly contactFacade: ContactFacade) {
    super();
  }

  @Post()
  @ApiOperation({
    summary: "Soumettre une demande de contact",
    description: "Permet aux visiteurs de soumettre une demande de contact pour les abonnements personnalisés.",
  })
  @ApiResponse({
    status: 201,
    description: "Demande de contact créée avec succès",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async createContactRequest(@Body() dto: CreateContactRequestDto) {
    const result = await this.contactFacade.createContactRequest({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone || null,
      organizationName: dto.organizationName || null,
      numberOfClasses: dto.numberOfClasses || null,
      message: dto.message,
    });

    return this.success(result);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard, SuperAdminGuard)
  @ApiOperation({
    summary: "Lister les demandes de contact (Super Admin)",
    description: "Récupère la liste des demandes de contact avec pagination et filtres.",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des demandes de contact",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès refusé - Super Admin requis" })
  async getContactRequests(@Query() query: ContactRequestQueryDto) {
    const result = await this.contactFacade.getContactRequests({
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });

    return this.success(result);
  }

  @Put(":id")
  @ApiBearerAuth()
  @UseGuards(AuthGuard, SuperAdminGuard)
  @ApiOperation({
    summary: "Mettre à jour une demande de contact (Super Admin)",
    description: "Met à jour le statut et les notes d'une demande de contact.",
  })
  @ApiResponse({
    status: 200,
    description: "Demande de contact mise à jour",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès refusé - Super Admin requis" })
  @ApiResponse({ status: 404, description: "Demande de contact non trouvée" })
  async updateContactRequest(
    @Param("id") id: string,
    @Body() dto: UpdateContactRequestDto,
    @CurrentUser() user: JWTPayload
  ) {
    const result = await this.contactFacade.updateContactRequest(id, {
      status: dto.status,
      notes: dto.notes,
      processedBy: user.userId,
    });

    return this.success(result);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(AuthGuard, SuperAdminGuard)
  @ApiOperation({
    summary: "Supprimer une demande de contact (Super Admin)",
    description: "Supprime définitivement une demande de contact.",
  })
  @ApiResponse({
    status: 200,
    description: "Demande de contact supprimée",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès refusé - Super Admin requis" })
  @ApiResponse({ status: 404, description: "Demande de contact non trouvée" })
  async deleteContactRequest(@Param("id") id: string) {
    await this.contactFacade.deleteContactRequest(id);
    return this.success({ deleted: true });
  }

  @Post(":id/reply")
  @ApiBearerAuth()
  @UseGuards(AuthGuard, SuperAdminGuard)
  @ApiOperation({
    summary: "Envoyer une réponse par email (Super Admin)",
    description: "Envoie un email de réponse à la personne qui a soumis la demande de contact.",
  })
  @ApiResponse({
    status: 200,
    description: "Email de réponse envoyé avec succès",
  })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès refusé - Super Admin requis" })
  @ApiResponse({ status: 404, description: "Demande de contact non trouvée" })
  async sendReply(
    @Param("id") id: string,
    @Body() dto: SendContactReplyDto
  ) {
    const result = await this.contactFacade.sendReply(
      id,
      dto.subject,
      dto.message
    );
    return this.success(result);
  }
}

