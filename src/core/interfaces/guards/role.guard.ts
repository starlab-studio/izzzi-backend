import { Reflector } from "@nestjs/core";
import { Inject } from "@nestjs/common";
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Role, ROLES_KEY } from "../decorators/role.decorator";
import { type ICacheService } from "src/core/domain/services/cache.service";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

type UserRolesCache = { organizationId: string; role: Role }[];

@Injectable()
export class RolesGuard implements CanActivate {
  // TODO : Définir dans les configs et utiliser configService
  private readonly CACHE_TTL = 300;
  private readonly CACHE_PREFIX = "user:roles:";

  constructor(
    private reflector: Reflector,
    @Inject("CACHE_SERVICE") private cacheService: ICacheService,
    private organizationFacade: OrganizationFacade
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user?.userId) {
      throw new UnauthorizedException("User not authenticated");
    }

    const organizationId = this.extractOrganizationId(request);

    if (!organizationId) {
      throw new ForbiddenException("Organization context required");
    }

    const userRoles = await this.getUserRoles(user.userId);

    const hasRole = requiredRoles.some((requiredRole) =>
      userRoles.some(
        (userRole) =>
          userRole.organizationId === organizationId &&
          userRole.role === requiredRole
      )
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `User does not have required role(s): ${requiredRoles.join(", ")}`
      );
    }
    request.organizationId = organizationId;
    request.userRoles = userRoles.filter(
      (r) => r.organizationId === organizationId
    );

    return true;
  }

  private async getUserRoles(userId: string): Promise<UserRolesCache> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;

    let userRoles = await this.cacheService.get<UserRolesCache>(cacheKey);

    if (userRoles) {
      return userRoles;
    }

    try {
      const userProfile = await this.organizationFacade.getUserProfile(userId);
      userRoles = userProfile.roles || [];

      await this.cacheService.set(cacheKey, userRoles, this.CACHE_TTL);

      return userRoles;
    } catch (error) {
      throw new UnauthorizedException("Failed to retrieve user roles");
    }
  }

  private extractOrganizationId(request: any): string | null {
    if (request.params?.organizationId) {
      return request.params.organizationId;
    }

    if (request.query?.organizationId) {
      return request.query.organizationId;
    }

    if (request.body?.organizationId) {
      return request.body.organizationId;
    }

    if (request.headers["x-organization-id"]) {
      return request.headers["x-organization-id"];
    }

    return null;
  }
}
