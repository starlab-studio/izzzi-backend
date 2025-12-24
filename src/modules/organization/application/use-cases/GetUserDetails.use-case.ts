import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
  UserRole,
} from "src/core";

import { IMembership, IUser } from "../../domain/types";
import { IUserRepository } from "../../domain/repositories/user.repository";

export class GetUserDetailsUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly userRepository: IUserRepository
  ) {
    super(logger);
  }

  async execute(
    userId: string
  ): Promise<
    IUser & { memberships: { organizationId: string; role: UserRole }[] }
  > {
    try {
      const user =
        await this.userRepository.findByIdWithActiveMemberships(userId);
      if (!user) {
        throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      const organizationIds = user.getOrganizationIds();
      const memberships = organizationIds.map((organizationId) => {
        const role = user.getRoleInOrganization(organizationId);
        if (!role) {
          throw new DomainError(
            ErrorCode.USER_HAS_NO_ORGANIZATION,
            `User does not have a role in organization ${organizationId}`
          );
        }
        return {
          organizationId,
          role,
        };
      });

      return {
        ...user.toPersistence(),
        memberships,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: IMembership): Promise<void> {}
}
