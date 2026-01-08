import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
  UserRole,
  IUnitOfWork,
} from "src/core";

import { DeleteAccountInput } from "../../domain/types";
import { IUserRepository } from "../../../organization/domain/repositories/user.repository";
import { IAuthIdentityRepository } from "../../../auth/domain/repositories/authIdentity.repository";
import { IOrganizationRepository } from "../../../organization/domain/repositories/organization.repository";
import { IMembershipRepository } from "../../../organization/domain/repositories/membership.repository";
import { IAuthStrategy } from "../../../auth/domain/types";

export class DeleteAccountUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly unitOfWork: IUnitOfWork,
    private readonly userRepository: IUserRepository,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly authStrategy: IAuthStrategy,
  ) {
    super(logger);
  }

  async execute(data: DeleteAccountInput): Promise<void> {
    try {
      const user = await this.userRepository.findByIdWithActiveMemberships(
        data.userId,
      );
      if (!user) {
        throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      let isAdmin = false;
      const ownedOrganizations = await this.organizationRepository.findByOwner(
        data.userId,
      );
      for (const org of ownedOrganizations) {
        if (user.hasRoleInOrganization(org.id, UserRole.ADMIN)) {
          isAdmin = true;
          break;
        }
      }

      if (!isAdmin) {
        throw new DomainError(
          ErrorCode.INVALID_ROLE_FOR_MEMBERSHIP,
          "Only admins can delete their account",
        );
      }

      await this.unitOfWork.withTransaction(async () => {
        for (const organization of ownedOrganizations) {
          const memberships =
            await this.membershipRepository.findByOrganization(organization.id);

          for (const membership of memberships) {
            if (membership.userId === data.userId) {
              continue;
            }

            const memberUser =
              await this.userRepository.findByIdWithActiveMemberships(
                membership.userId,
              );
            if (!memberUser) {
              continue;
            }

            const allMemberships =
              await this.membershipRepository.findByUserIdWithOrganizations(
                memberUser.id,
              );
            const activeMemberships = allMemberships.filter((m) =>
              m.isActive(),
            );

            if (
              activeMemberships.length === 1 &&
              activeMemberships[0].organizationId === organization.id
            ) {
              const memberAuthIdentity =
                await this.authIdentityRepository.findByUsername(
                  memberUser.email,
                );
              if (memberAuthIdentity) {
                try {
                  await this.authStrategy.deleteIdentity(memberUser.email);
                } catch (error) {
                  this.logger.warn(
                    `Failed to delete auth identity for ${memberUser.email}: ${error}`,
                  );
                }
              }
              await this.userRepository.delete(memberUser.id);
            } else {
              await this.membershipRepository.delete(membership.id);
            }
          }

          const adminMembership = memberships.find(
            (m) => m.userId === data.userId,
          );
          if (adminMembership) {
            await this.membershipRepository.delete(adminMembership.id);
          }
          await this.organizationRepository.delete(organization.id);
        }

        const authIdentity = await this.authIdentityRepository.findByUsername(
          user.email,
        );
        if (authIdentity) {
          try {
            await this.authStrategy.deleteIdentity(user.email);
          } catch (error) {
            this.logger.warn(
              `Failed to delete auth identity for ${user.email}: ${error}`,
            );
          }
        }

        await this.userRepository.delete(data.userId);
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
