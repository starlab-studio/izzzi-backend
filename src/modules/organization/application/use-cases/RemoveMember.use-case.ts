import {
  DomainError,
  ErrorCode,
  ILoggerService,
  UserRole,
  IUnitOfWork,
} from "src/core";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { IRefreshTokenRepository } from "../../../auth/domain/repositories/refreshToken.repository";

export interface RemoveMemberData {
  membershipId: string;
  organizationId: string;
  requesterId: string;
}

export class RemoveMemberUseCase {
  constructor(
    private readonly logger: ILoggerService,
    private readonly membershipRepository: IMembershipRepository,
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(data: RemoveMemberData): Promise<void> {
    this.logger.info(
      `Removing member from organization: membershipId=${data.membershipId}, organizationId=${data.organizationId}`
    );

    const membership = await this.membershipRepository.findById(data.membershipId);
    if (!membership) {
      throw new DomainError(
        ErrorCode.MEMBERSHIP_NOT_FOUND,
        "Membership not found"
      );
    }

    if (membership.organizationId !== data.organizationId) {
      throw new DomainError(
        ErrorCode.UNAUTHORIZED_ROLE,
        "Membership does not belong to this organization"
      );
    }

    const requesterMembership = await this.membershipRepository.findByUserAndOrganization(
      data.requesterId,
      data.organizationId
    );

    if (!requesterMembership || requesterMembership.role !== UserRole.ADMIN) {
      throw new DomainError(
        ErrorCode.UNAUTHORIZED_ROLE,
        "Only admin can remove members"
      );
    }

    if (membership.userId === data.requesterId) {
      throw new DomainError(
        ErrorCode.UNAUTHORIZED_ROLE,
        "Cannot remove yourself from the organization"
      );
    }

    await this.unitOfWork.withTransaction(async () => {
      membership.markAsDeleted();
      await this.membershipRepository.save(membership);

      const allMemberships = await this.membershipRepository.findByUserIdWithOrganizations(
        membership.userId
      );
      const activeMemberships = allMemberships.filter((m) => m.isActive());

      if (activeMemberships.length === 0) {
        this.logger.info(
          `User ${membership.userId} has no other organizations. Marking user as deleted (soft delete).`
        );

        const user = await this.userRepository.findById(membership.userId);
        if (user) {
          user.markAsDeleted();
          await this.userRepository.save(user);
          await this.refreshTokenRepository.revokeAllByUserId(user.id);

          this.logger.info(
            `User ${membership.userId} marked as deleted and all tokens revoked.`
          );
        }
      } else {
        this.logger.info(
          `User ${membership.userId} has ${activeMemberships.length} other active membership(s). Keeping user account.`
        );
      }
    });

    this.logger.info(
      `Member removed successfully: membershipId=${data.membershipId}, organizationId=${data.organizationId}`
    );
  }
}
