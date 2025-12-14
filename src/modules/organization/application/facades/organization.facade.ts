import { UserRole, DomainError, ErrorCode } from "src/core";
import { IUser, IUserCreate } from "../../domain/types";
import { OrganizationService } from "../services/organization.service";
import { GetUserDetailsUseCase } from "../use-cases/GetUserDetails.use-case";
import { GetUserMembershipsUseCase } from "../use-cases/get-user-membership.use-case";
import { IUserRepository } from "../../domain/repositories/user.repository";

export class OrganizationFacade {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly getUserDetailsUseCase: GetUserDetailsUseCase,
    private readonly getUserMembershipsUseCase: GetUserMembershipsUseCase,
    private readonly userRepository: IUserRepository
  ) {}

  async createUserAndOrganization(data: IUserCreate): Promise<IUser> {
    try {
      return await this.organizationService.createUserAndOrganization(data);
    } catch (error) {
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<
    IUser & {
      memberships: {
        organizationId: string;
        role: UserRole;
      }[];
    }
  > {
    try {
      return await this.getUserDetailsUseCase.execute(userId);
    } catch (error) {
      throw error;
    }
  }

  async getUserMembershipsWithOrganizations(userId: string) {
    try {
      return await this.getUserMembershipsUseCase.execute(userId);
    } catch (error) {
      throw error;
    }
  }

  async validateUserCanCreateClass(
    userId: string,
    organizationId: string,
    requiredRoles: UserRole[]
  ): Promise<void> {
    const user = await this.userRepository.findByIdWithActiveMemberships(userId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    if (!user.belongsToOrganization(organizationId)) {
      throw new DomainError(
        ErrorCode.USER_HAS_NO_ORGANIZATION,
        "User is not a member of this organization"
      );
    }

    if (!user.hasAnyRoleInOrganization(organizationId, requiredRoles)) {
      throw new DomainError(
        ErrorCode.UNAUTHORIZED_ROLE,
        `User must have one of the following roles: ${requiredRoles.join(", ")}`
      );
    }
  }
}
