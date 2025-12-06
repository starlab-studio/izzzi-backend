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

      const memberships = user.getOrganizationIds().map((organizationId) => ({
        organizationId,
        role: user.getRoleInOrganization(organizationId)!,
      }));

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
