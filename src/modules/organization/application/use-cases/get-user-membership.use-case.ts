import {
  IUseCase,
  BaseUseCase,
  DomainError,
  ErrorCode,
  type ILoggerService,
} from "src/core";
import { type IMembershipRepository } from "../../domain/repositories/membership.repository";
import { MembershipWithOrganizationData } from "../../domain/types";
import { MembershipEntity } from "../../domain/entities/membership.entity";

export class GetUserMembershipsUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly membershipRepository: IMembershipRepository
  ) {
    super(logger);
  }

  async execute(userId: string): Promise<MembershipWithOrganizationData[]> {
    try {
      this.logger.info(
        `Getting memberships with organizations for user: ${userId}`
      );

      const memberships =
        await this.membershipRepository.findByUserIdWithOrganizations(userId);

      if (memberships.length === 0) {
        throw new DomainError(
          ErrorCode.NO_MEMBERSHIPS_FOUND,
          "User has no active memberships"
        );
      }

      return memberships.map((membership: MembershipEntity) => {
        const organization = membership.organization;

        if (!organization) {
          throw new DomainError(
            ErrorCode.ORGANIZATION_NOT_FOUND,
            `Organization not found for membership ${membership.id}`
          );
        }

        return {
          ...membership.toPersistence(),
          organization: organization.toPersistence(),
        };
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: any): Promise<void> {}
}
