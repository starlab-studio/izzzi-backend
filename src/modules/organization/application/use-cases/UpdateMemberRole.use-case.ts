import { DomainError, ErrorCode, ILoggerService, IUnitOfWork, UserRole } from "src/core";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";

export interface UpdateMemberRoleData {
  membershipId: string;
  newRole: UserRole;
  organizationId: string;
  requesterId: string;
}

export class UpdateMemberRoleUseCase {
  constructor(
    private readonly logger: ILoggerService,
    private readonly membershipRepository: IMembershipRepository,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(data: UpdateMemberRoleData): Promise<void> {
    return await this.unitOfWork.withTransaction(async () => {
    this.logger.info(
      `Updating member role: membershipId=${data.membershipId}, newRole=${data.newRole}`
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
        "Only admin can update member roles"
      );
    }

    if (membership.userId === data.requesterId) {
      throw new DomainError(
        ErrorCode.UNAUTHORIZED_ROLE,
        "Cannot change your own role"
      );
    }

    membership.updateRole(data.newRole);
    await this.membershipRepository.save(membership);

    this.logger.info(
      `Member role updated successfully: membershipId=${data.membershipId}, newRole=${data.newRole}`
    );
    });
  }
}
