import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { GlobalRole } from "src/modules/organization/domain/types";

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => OrganizationFacade))
    private readonly organizationFacade: OrganizationFacade,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: { userId?: string };
    }>();
    const { user } = request;

    if (!user?.userId) {
      throw new ForbiddenException("User not authenticated");
    }

    const userProfile = await this.organizationFacade.getUserProfile(
      user.userId,
    );

    if (userProfile.role !== GlobalRole.SUPER_ADMIN) {
      throw new ForbiddenException("Access denied - Super Admin required");
    }

    return true;
  }
}
