import { DomainError, ErrorCode, ILoggerService, UserRole } from "src/core";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";
import { IUser } from "../../domain/types";

export interface GetOrganizationMembersData {
  organizationId: string;
  requesterId: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  role: UserRole;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export class GetOrganizationMembersUseCase {
  constructor(
    private readonly logger: ILoggerService,
    private readonly membershipRepository: IMembershipRepository
  ) {}

  async execute(data: GetOrganizationMembersData): Promise<OrganizationMember[]> {
    this.logger.info(`Getting organization members: organizationId=${data.organizationId}`);

    // Verify requester belongs to the organization
    const requesterMembership = await this.membershipRepository.findByUserAndOrganization(
      data.requesterId,
      data.organizationId
    );

    if (!requesterMembership) {
      throw new DomainError(
        ErrorCode.USER_HAS_NO_ORGANIZATION,
        "User is not a member of this organization"
      );
    }

    // Get all active members with user details
    const memberships = await this.membershipRepository.findActiveByOrganization(
      data.organizationId
    );

    return memberships.map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      role: membership.role,
      createdAt: membership.createdAt,
      user: {
        id: membership.user?.id || membership.userId,
        firstName: membership.user?.firstName || "",
        lastName: membership.user?.lastName || "",
        email: membership.user?.email || "",
        avatarUrl: membership.user?.avatarUrl || null,
      },
    }));
  }
}
