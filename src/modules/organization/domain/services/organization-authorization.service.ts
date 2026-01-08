import { DomainError, ErrorCode, UserRole } from "src/core";
import { IUserRepository } from "../../domain/repositories/user.repository";

export class OrganizationAuthorizationService {
  constructor(private readonly userRepository: IUserRepository) {}

  async canAccess(userId: string, organizationId: string): Promise<boolean> {
    const user =
      await this.userRepository.findByIdWithActiveMemberships(userId);

    if (!user) return false;
    if (user.isSuperAdmin()) return true;
    return user.belongsToOrganization(organizationId);
  }

  async canManage(userId: string, organizationId: string): Promise<boolean> {
    const user =
      await this.userRepository.findByIdWithActiveMemberships(userId);

    if (!user) {
      return false;
    }

    return user.hasRoleInOrganization(organizationId, UserRole.ADMIN);
  }

  async assertCanAccess(userId: string, organizationId: string): Promise<void> {
    const hasAccess = await this.canAccess(userId, organizationId);

    if (!hasAccess) {
      throw new DomainError(
        ErrorCode.ORGANIZATION_ACCESS_DENIED,
        "You do not have access to this organization",
      );
    }
  }

  async assertCanManage(userId: string, organizationId: string): Promise<void> {
    const canManage = await this.canManage(userId, organizationId);

    if (!canManage) {
      throw new DomainError(
        ErrorCode.INVALID_ROLE_FOR_MEMBERSHIP,
        "You do not have permission to manage this organization",
      );
    }
  }
}
