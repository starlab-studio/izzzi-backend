import { Controller, Post, Body, UseGuards, Req } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  BaseController,
  AuthGuard,
  RolesGuard,
  CurrentUser,
  Role,
  Roles,
} from "src/core";
import { ClassFacade } from "../../application/facades/class.facade";
import { CreateClassDto } from "../dto/class.dto";
import type { JWTPayload } from "src/modules/auth/infrastructure/factories/custom.adapter";

@ApiTags("Classes")
@Controller("v1/classes")
export class ClassController extends BaseController {
  constructor(private readonly classFacade: ClassFacade) {
    super();
  }

  @Post()
  @ApiOperation({ summary: "Créer une nouvelle classe" })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.LEARNING_MANAGER)
  @ApiResponse({ status: 201, description: "Classe créée avec succès" })
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async createClass(
    @Body() dto: CreateClassDto,
    @CurrentUser() user: JWTPayload,
    @Req() request: any,
  ) {
    const createdClass = await this.classFacade.createClass(
      {
        ...dto,
        description: dto.description ?? null,
        organizationId: request.organizationId,
        userId: user.userId,
      },
      user.username,
    );

    return this.success(createdClass);
  }
}
