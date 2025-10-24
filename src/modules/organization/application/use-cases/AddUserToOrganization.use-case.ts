import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  ErrorCode,
} from "src/core";

import { Role } from "../../domain/types";
import { MembershipDomainService } from "../../domain/services/membership.domain.service";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";
import { MembershipEntity } from "../../domain/entities/membership.entity";

export class AddUserToOrganizationUseCase
  extends BaseUseCase
  implements IUseCase
{
  constructor(
    readonly logger: ILoggerService,
    private readonly membershipDomainService: MembershipDomainService,
    private readonly memberShipRepository: IMembershipRepository
  ) {
    super(logger);
  }

  async execute(data: {
    userId: string;
    organizationId: string;
    role: Role;
    addedBy: string | null;
  }): Promise<void> {
    try {
      const existingMembership =
        await this.memberShipRepository.findByUserAndOrganization(
          data.userId,
          data.organizationId
        );
      this.membershipDomainService.validateMembershipUniqueness(
        existingMembership
      );

      const membership = new MembershipEntity(data);
      const ormMembership = await this.memberShipRepository.create(membership);
      if (!ormMembership) {
        throw new ApplicationError(
          ErrorCode.APPLICATION_FAILED_TO_CREATE,
          "Something went wrong during creation. Please try again later."
        );
      }
    } catch (error) {
      this.handleError(error);
    }
  }
}
