import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
  Email,
  UserRole,
  IUnitOfWork,
} from "src/core";

import { UpdateProfileInput, UpdateProfileOutput } from "../../domain/types";
import { IUserRepository } from "../../../organization/domain/repositories/user.repository";
import { IAuthIdentityRepository } from "../../../auth/domain/repositories/authIdentity.repository";
import { AuthIdentityUniquenessService } from "../../../auth/domain/services/authIdentity-uniqueness.service";
import { IOrganizationRepository } from "../../../organization/domain/repositories/organization.repository";
import { OrganizationFacade } from "../../../organization/application/facades/organization.facade";

export class UpdateProfileUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly unitOfWork: IUnitOfWork,
    private readonly userRepository: IUserRepository,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly authIdentityUniquenessService: AuthIdentityUniquenessService,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly organizationFacade: OrganizationFacade
  ) {
    super(logger);
  }

  async execute(data: UpdateProfileInput): Promise<UpdateProfileOutput> {
    try {
      return await this.unitOfWork.withTransaction(async () => {
        const user = await this.userRepository.findById(data.userId);
        if (!user) {
          throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
        }

        const updateData: {
          firstName?: string;
          lastName?: string;
        } = {};

        if (data.firstName !== undefined) {
          updateData.firstName = data.firstName.trim();
        }

        if (data.lastName !== undefined) {
          updateData.lastName = data.lastName.trim();
        }

        if (Object.keys(updateData).length > 0) {
          user.updateProfile(updateData);
          await this.userRepository.save(user);
        }

        if (data.email !== undefined && data.email.trim().toLowerCase() !== user.email.toLowerCase()) {
          const newEmail = Email.create(data.email.trim());
          const oldEmail = user.email;

          await this.authIdentityUniquenessService.ensureEmailIsUnique(
            newEmail.value
          );

          const authIdentity = await this.authIdentityRepository.findByUsername(
            oldEmail
          );

          if (authIdentity) {
            authIdentity.updateUsername(newEmail.value);
            await this.authIdentityRepository.save(authIdentity);
          }

          user.updateEmail(newEmail.value);
          await this.userRepository.save(user);
        }

        if (
          data.organizationId &&
          data.organizationName !== undefined &&
          data.organizationName.trim() !== ""
        ) {
          const userWithMemberships = await this.userRepository.findByIdWithActiveMemberships(
            data.userId
          );

          if (!userWithMemberships) {
            throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
          }

          if (
            !userWithMemberships.hasRoleInOrganization(
              data.organizationId,
              UserRole.ADMIN
            )
          ) {
            throw new DomainError(
              ErrorCode.INVALID_ROLE_FOR_MEMBERSHIP,
              "Only admins can update organization name"
            );
          }

          const organization = await this.organizationRepository.findById(
            data.organizationId
          );

          if (!organization) {
            throw new DomainError(
              ErrorCode.ORGANIZATION_NOT_FOUND,
              "Organization not found"
            );
          }

          if (organization.name !== data.organizationName.trim()) {
            const existingOrg = await this.organizationRepository.findByName(
              data.organizationName.trim()
            );

            if (existingOrg && existingOrg.id !== data.organizationId) {
              throw new DomainError(
                ErrorCode.ORGANIZATION_ALREADY_EXIST,
                "Organization name already exists"
              );
            }

            organization.updateName(data.organizationName.trim());
            await this.organizationRepository.save(organization);
          }
        }

        return user.toPersistence();
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

