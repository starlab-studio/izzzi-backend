import { Reflector } from "@nestjs/core";
import { Inject, forwardRef } from "@nestjs/common";
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";

import { UserRole } from "src/core/domain/types";
import { ROLES_KEY } from "../decorators/role.decorator";
import { type ICacheService } from "src/core/domain/services/cache.service";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { GlobalRole } from "src/modules/organization/domain/types";

type UserRolesCache = { organizationId: string; role: UserRole }[];

@Injectable()
export class RolesGuard implements CanActivate {
  // TODO : Définir dans les configs et utiliser configService
  private readonly CACHE_TTL = 300;
  private readonly CACHE_PREFIX = "user:roles:";

  constructor(
    private reflector: Reflector,
    @Inject("CACHE_SERVICE") private cacheService: ICacheService,
    @Inject(forwardRef(() => OrganizationFacade))
    private organizationFacade: OrganizationFacade
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user?.userId) {
      throw new UnauthorizedException("User not authenticated");
    }

    const userProfile = await this.getUserProfile(user.userId);

    if (userProfile.role === GlobalRole.SUPER_ADMIN) {
      const organizationId = this.extractOrganizationId(request);
      if (organizationId) {
        request.organizationId = organizationId;
      }
      request.userRoles = [];
      return true;
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

  private async getUserProfile(userId: string) {
    const cacheKey = `${this.CACHE_PREFIX}profile:${userId}`;

    let userProfile =
      await this.cacheService.get<
        Awaited<ReturnType<OrganizationFacade["getUserProfile"]>>
      >(cacheKey);

    if (userProfile) {
      return userProfile;
    }

    try {
      userProfile = await this.organizationFacade.getUserProfile(userId);
      await this.cacheService.set(cacheKey, userProfile, this.CACHE_TTL);
      return userProfile;
    } catch (error) {
      throw new UnauthorizedException("Failed to retrieve user profile");
    }
  }

  private async getUserRoles(userId: string): Promise<UserRolesCache> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;

    let userRoles = await this.cacheService.get<UserRolesCache>(cacheKey);

    if (userRoles) {
      return userRoles;
    }

    try {
      const userProfile = await this.organizationFacade.getUserProfile(userId);
      userRoles = userProfile.memberships || [];

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
