import { DomainError, ErrorCode, ILoggerService, UserRole } from "src/core";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";

export interface RemoveMemberData {
  membershipId: string;
  organizationId: string;
  requesterId: string;
}

export class RemoveMemberUseCase {
  constructor(
    private readonly logger: ILoggerService,
    private readonly membershipRepository: IMembershipRepository
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

    membership.markAsDeleted();
    await this.membershipRepository.save(membership);

    this.logger.info(
      `Member removed successfully: membershipId=${data.membershipId}, organizationId=${data.organizationId}`
    );
  }
}
