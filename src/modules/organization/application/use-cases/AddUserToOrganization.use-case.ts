import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ApplicationError,
  ErrorCode,
  UserRole,
} from "src/core";

import { IMembership } from "../../domain/types";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";
import { MembershipEntity } from "../../domain/entities/membership.entity";

export class AddUserToOrganizationUseCase
  extends BaseUseCase
  implements IUseCase
{
  constructor(
    readonly logger: ILoggerService,
    private readonly memberShipRepository: IMembershipRepository,
  ) {
    super(logger);
  }

  async execute(data: {
    userId: string;
    organizationId: string;
    role: UserRole;
    addedBy: string | null;
  }): Promise<IMembership> {
    try {
      const existingMembership =
        await this.memberShipRepository.findByUserAndOrganization(
          data.userId,
          data.organizationId,
        );

      if (existingMembership) {
        throw new DomainError(
          ErrorCode.USER_ORGANIZATION_ALREADY_EXISTS,
          "User is already associated with this organization",
        );
      }

      const membership = MembershipEntity.create({ ...data });
      const ormMembership = await this.memberShipRepository.create(membership);
      if (!ormMembership) {
        throw new ApplicationError(
          ErrorCode.APPLICATION_FAILED_TO_CREATE,
          "Something went wrong during creation. Please try again later.",
        );
      }
      return ormMembership.toPersistence();
    } catch (error) {
      this.handleError(error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async withCompensation(_input: IMembership): Promise<void> {}
}
