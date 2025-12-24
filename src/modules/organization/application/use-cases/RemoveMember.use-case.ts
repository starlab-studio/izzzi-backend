import {
  DomainError,
  ErrorCode,
  ILoggerService,
  UserRole,
  IUnitOfWork,
} from "src/core";
import { ModuleRef } from "@nestjs/core";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { IAuthIdentityRepository } from "../../../auth/domain/repositories/authIdentity.repository";
import { IAuthStrategy } from "../../../auth/domain/types";

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
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly moduleRef: ModuleRef,
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
          `User ${membership.userId} has no other organizations. Deleting user account completely.`
        );

        const user = await this.userRepository.findById(membership.userId);
        if (user) {
          const authIdentity = await this.authIdentityRepository.findByUsername(
            user.email
          );
          if (authIdentity) {
            try {
              const authStrategy = this.moduleRef.get<IAuthStrategy>(
                "AUTH_IDENTITY_PROVIDER",
                { strict: false }
              );
              if (authStrategy) {
                await authStrategy.deleteIdentity(user.email);
              }
            } catch (error) {
              this.logger.warn(
                `Failed to delete auth identity for ${user.email}: ${error}`
              );
            }
          }

          await this.userRepository.delete(user.id);
          this.logger.info(`User ${membership.userId} deleted successfully.`);
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
