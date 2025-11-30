import { Controller, Post, Body, Request } from "@nestjs/common";
import { BaseController } from "src/core/interfaces/controller/base.controller";
import { ClassFacade } from "../../application/facades/class.facade";
import { CreateClassDto } from "../dto/class.dto";
import { JWTPayload } from "src/modules/auth/infrastructure/factories/custom.adapter";
import { Role } from "src/modules/organization/domain/types";
// import { AuthGuard } from "src/core/guards/auth.guard";

interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

@Controller("v1/classes")
export class ClassController extends BaseController {
  constructor(private readonly classFacade: ClassFacade) {
    super();
  }

  // @AuthGuard(Role.PEDAGOGICAL_RESPONSIBLE)
  @Post()
  async createClass(
    @Body() dto: CreateClassDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const pedagogicalRole = req.user.roles.find(
      (r) => r.role === Role.PEDAGOGICAL_RESPONSIBLE
    );

    const organizationId = pedagogicalRole!.organizationId;
    const userId = req.user.userId;
    const userEmail = req.user.username;

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
