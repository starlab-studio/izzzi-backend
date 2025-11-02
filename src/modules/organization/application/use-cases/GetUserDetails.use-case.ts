import { IUseCase, BaseUseCase, ILoggerService } from "src/core";

import { IMembership, IUser, Role } from "../../domain/types";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";
import { MembershipDomainService } from "../../domain/services/membership.domain.service";
import { UserDomainService } from "../../domain/services/user.domain.service";
import { IUserRepository } from "../../domain/repositories/user.repository";

export class GetUserDetailsUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly userDomainService: UserDomainService,
    private readonly userRepository: IUserRepository,
    private readonly membershipDomainService: MembershipDomainService,
    private readonly memberShipRepository: IMembershipRepository
  ) {
    super(logger);
  }

  async execute(
    userId: string
  ): Promise<IUser & { roles: { organizationId: string; role: Role }[] }> {
    try {
      const user = await this.userRepository.findById(userId);
      this.userDomainService.canUserLogin(user);

      const memberships = await this.memberShipRepository.findByUser(userId);
      this.membershipDomainService.validateMembershipExsits(memberships);

      const roles = memberships.map((m) => ({
        organizationId: m.organizationId,
        role: m.role,
      }));

      return { ...user!, roles };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompenstation(input: IMembership): Promise<void> {}
}
