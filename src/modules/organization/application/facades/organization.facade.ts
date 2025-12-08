import { UserRole } from "src/core";
import { IUser, IUserCreate } from "../../domain/types";
import { OrganizationService } from "../services/organization.service";
import { GetUserDetailsUseCase } from "../use-cases/GetUserDetails.use-case";
import { GetUserMembershipsUseCase } from "../use-cases/get-user-membership.use-case";

export class OrganizationFacade {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly getUserDetailsUseCase: GetUserDetailsUseCase,
    private readonly getUserMembershipsUseCase: GetUserMembershipsUseCase
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
}
