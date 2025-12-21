import { UserRole, DomainError, ErrorCode, IUnitOfWork } from "src/core";
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
import {
  AcceptInvitationUseCase,
  AcceptInvitationData,
} from "../use-cases/accept-invitation.use-case";
import {
  ValidateInvitationUseCase,
  ValidateInvitationData,
  ValidateInvitationResponse,
} from "../use-cases/validate-invitation.use-case";
import { CreateUserUseCase } from "../use-cases/CreateUser.use-case";
import { AddUserToOrganizationUseCase } from "../use-cases/AddUserToOrganization.use-case";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { IInvitationRepository } from "../../domain/repositories/invitation.repository";

export class OrganizationFacade {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly getUserDetailsUseCase: GetUserDetailsUseCase,
    private readonly getUserMembershipsUseCase: GetUserMembershipsUseCase,
    private readonly userRepository: IUserRepository,
    private readonly getOrganizationUseCase: GetOrganizationUseCase,
    private readonly sendInvitationUseCase: SendInvitationUseCase,
    private readonly acceptInvitationUseCase: AcceptInvitationUseCase,
    private readonly validateInvitationUseCase: ValidateInvitationUseCase,
    private readonly invitationRepository: IInvitationRepository,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly addUserToOrganizationUseCase: AddUserToOrganizationUseCase,
    private readonly unitOfWork: IUnitOfWork
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
    const user =
      await this.userRepository.findByIdWithActiveMemberships(userId);
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

  async validateUserBelongsToOrganization(
    userId: string,
    organizationId: string
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

  async acceptInvitation(data: AcceptInvitationData): Promise<void> {
    try {
      return await this.acceptInvitationUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }

  async validateInvitation(
    data: ValidateInvitationData
  ): Promise<ValidateInvitationResponse> {
    try {
      return await this.validateInvitationUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }

  async findInvitationByToken(token: string) {
    try {
      return await this.invitationRepository.findByToken(token);
    } catch (error) {
      throw error;
    }
  }

  async checkUserExistsByEmail(email: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findByEmail(email);
      return !!user;
    } catch (error) {
      throw error;
    }
  }

  async createUser(data: IUserCreate): Promise<IUser> {
    try {
      return await this.createUserUseCase.execute(data);
    } catch (error) {
      throw error;
    }
  }

  async createUserAndAcceptInvitation(data: {
    userData: IUserCreate;
    invitationToken: string;
    organizationId: string;
    role: UserRole;
    invitedBy: string | null;
  }): Promise<IUser> {
    try {
      return await this.unitOfWork.withTransaction(async () => {
        // Create user
        const user = await this.createUserUseCase.execute(data.userData);

        // Find and accept invitation
        const invitation = await this.invitationRepository.findByToken(
          data.invitationToken
        );
        if (!invitation) {
          throw new DomainError(
            ErrorCode.INVALID_OR_EXPIRED_INVITATION,
            "Invitation not found"
          );
        }

        invitation.markAsAccepted();
        await this.invitationRepository.save(invitation);

        // Create membership
        await this.addUserToOrganizationUseCase.execute({
          userId: user.id,
          organizationId: data.organizationId,
          role: data.role,
          addedBy: data.invitedBy,
        });

        return user;
      });
    } catch (error) {
      throw error;
    }
  }

  async acceptInvitationAndCreateMembership(data: {
    invitationToken: string;
    userId: string;
    organizationId: string;
    role: UserRole;
    invitedBy: string | null;
  }): Promise<void> {
    try {
      const invitation = await this.invitationRepository.findByToken(
        data.invitationToken
      );
      if (!invitation) {
        throw new DomainError(
          ErrorCode.INVALID_OR_EXPIRED_INVITATION,
          "Invitation not found"
        );
      }

      invitation.markAsAccepted();
      await this.invitationRepository.save(invitation);

      await this.addUserToOrganizationUseCase.execute({
        userId: data.userId,
        organizationId: data.organizationId,
        role: data.role,
        addedBy: data.invitedBy,
      });
    } catch (error) {
      throw error;
    }
  }
}
