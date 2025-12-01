import { Controller, Post, Body, Request } from "@nestjs/common";
import { BaseController } from "src/core/interfaces/controller/base.controller";
import { ClassFacade } from "../../application/facades/class.facade";
import { CreateClassDto } from "../dto/class.dto";
import { JWTPayload } from "src/modules/auth/infrastructure/factories/custom.adapter";
import { DomainError, ErrorCode } from "src/core";

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

@Controller("v1/classes")
export class ClassController extends BaseController {
  constructor(private readonly classFacade: ClassFacade) {
    super();
  }

  @Post()
  async createClass(
    @Body() dto: CreateClassDto,
    @Request() req: AuthenticatedRequest,
  ) {
    //faites pas attendition a tous ça c'etait juste pour tester mais je clinerais

    if (!req.user) {
      throw new DomainError(
        ErrorCode.INVALID_AUTH_DATA,
        "Authentification requise",
      );
    }

    //pareil pour ici passez votre chemain
    const organizationId = req.user.roles?.[0]?.organizationId;
    const userId = req.user.userId || req.user.sub;
    const userEmail = req.user.username;

    if (!organizationId) {
      throw new DomainError(
        ErrorCode.INVALID_AUTH_DATA,
        "Aucune organisation trouvée pour cet utilisateur",
      );
    }
    //meme ici chef
    if (!userId) {
      throw new DomainError(
        ErrorCode.INVALID_AUTH_DATA,
        "Impossible de déterminer l'identifiant de l'utilisateur",
      );
    }

    const createdClass = await this.classFacade.createClass(
      {
        ...dto,
        organizationId,
        userId,
      },
      userEmail,
    );

    return this.success(createdClass);
  }
}