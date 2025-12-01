import { Controller, Post, Body, Request } from "@nestjs/common";
import { BaseController } from "src/core/interfaces/controller/base.controller";
import { SubjectFacade } from "../../application/facades/subject.facade";
import { JWTPayload } from "src/modules/auth/infrastructure/factories/custom.adapter";
import { Role } from "src/modules/organization/domain/types";
import { Request as ExpressRequest } from "express";
// import { AuthGuard } from "src/core/guards/auth.guard";
import { CreateSubjectDto } from "../dto/subject.dto";

interface AuthenticatedRequest extends ExpressRequest {
  user: JWTPayload;
}

@Controller("v1/subjects")
export class SubjectController extends BaseController {
  constructor(private readonly subjectFacade: SubjectFacade) {
    super();
  }

  @Post()
  async createSubject(
    @Body() dto: CreateSubjectDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const roleEntry =
      req.user.roles.find((r) => r.role === Role.ADMIN) ?? req.user.roles[0];
    const organizationId = roleEntry.organizationId;

    const userId = req.user.sub;
    const userEmail = req.user.username;

    const createdSubject = await this.subjectFacade.createSubject(
      {
        ...dto,
        organizationId,
        userId,
      },
      userEmail,
    );

    return this.success(createdSubject);
  }
}
