import { DomainError, ErrorCode, UserRole, HTTP_STATUS } from "src/core";
import { UserEntity } from "../entities/user.entity";
import { OrganizationEntity } from "../entities/organization.entity";

export class InvitationAuthorizationService {
  canUserInviteToOrganization(
    inviter: UserEntity,
    organization: OrganizationEntity
  ): void {
    if (!inviter.belongsToOrganization(organization.id)) {
      throw new DomainError(
        ErrorCode.NOT_ORGANIZATION_MEMBER,
        "User is not a member of this organization",
        undefined,
        HTTP_STATUS.FORBIDDEN
      );
    }

    if (!inviter.hasRoleInOrganization(organization.id, UserRole.ADMIN)) {
      throw new DomainError(
        ErrorCode.INSUFFICIENT_PERMISSIONS,
        "Only admins can send invitations",
        undefined,
        HTTP_STATUS.FORBIDDEN
      );
    }

    organization.canInviteMember();
  }

  validateInvitedRole(invitedRole: UserRole): void {
    if (invitedRole === UserRole.SUPER_ADMIN) {
      throw new DomainError(
        ErrorCode.INVALID_INVITED_ROLE,
        "Cannot invite users as SUPER_ADMIN"
      );
    }

    const allowedRoles = [UserRole.ADMIN, UserRole.LEARNING_MANAGER];
    if (!allowedRoles.includes(invitedRole)) {
      throw new DomainError(
        ErrorCode.INVALID_INVITED_ROLE,
        `Can only invite users with roles: ${allowedRoles.join(", ")}`
      );
    }
  }
}
