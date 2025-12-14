import { UserRole } from "src/core";
import {
  IInvitation,
  IInvitationCreate,
  IOrganization,
  IUser,
  IUserCreate,
} from "../../domain/types";
import { OrganizationService } from "../services/organization.service";
import { GetUserDetailsUseCase } from "../use-cases/GetUserDetails.use-case";
import { GetUserMembershipsUseCase } from "../use-cases/get-user-membership.use-case";
import { GetOrganizationUseCase } from "../use-cases/GetOrganization.use-case";
import { SendInvitationUseCase } from "../use-cases/send-invitation.use-case";

export class OrganizationFacade {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly getUserDetailsUseCase: GetUserDetailsUseCase,
    private readonly getUserMembershipsUseCase: GetUserMembershipsUseCase,
    private readonly getOrganizationUseCase: GetOrganizationUseCase,
    private readonly sendInvitationUseCase: SendInvitationUseCase
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

  async getOneOrganization(
    organizationId: string,
    userId: string
  ): Promise<IOrganization | null> {
    try {
      return await this.getOrganizationUseCase.execute({
        organizationId,
        userId,
      });
    } catch (error) {
      throw error;
    }
  }

  async sendUserInvitation(data: IInvitationCreate): Promise<IInvitation> {
    try {
      return await this.sendInvitationUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }
}
