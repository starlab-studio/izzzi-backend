import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  BaseController,
  AuthGuard,
  CurrentUser,
  Role,
  DomainError,
  ErrorCode,
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
  @UseGuards(AuthGuard)
  @ApiResponse({ status: 201, description: "Classe créée avec succès" })
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Authentification requise" })
  async createClass(
    @Body() dto: CreateClassDto,
    @CurrentUser() user: JWTPayload,
  ) {
    const learningManagerRole = user.roles.find(
      (r) => r.role === Role.LEARNING_MANAGER,
    );

    if (!learningManagerRole) {
      throw new DomainError(
        ErrorCode.INVALID_AUTH_DATA,
        "Vous devez avoir le rôle LEARNING_MANAGER pour créer une classe",
      );
    }

    const createdClass = await this.classFacade.createClass(
      {
        ...dto,
        organizationId: learningManagerRole.organizationId,
        userId: user.userId,
      },
      user.username,
    );

    return this.success(createdClass);
  }
}
