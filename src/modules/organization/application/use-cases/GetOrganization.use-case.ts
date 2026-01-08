import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";

import { IOrganization } from "../../domain/types";
import { IOrganizationRepository } from "../../domain/repositories/organization.repository";
import { OrganizationAuthorizationService } from "../../domain/services/organization-authorization.service";

export class GetOrganizationUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly organizationAuthorizationService: OrganizationAuthorizationService,
  ) {
    super(logger);
  }
  async execute(data: {
    organizationId: string;
    userId: string;
  }): Promise<IOrganization> {
    try {
      await this.organizationAuthorizationService.assertCanAccess(
        data.userId,
        data.organizationId,
      );

      const organisation = await this.organizationRepository.findById(
        data.organizationId,
      );

      if (!organisation) {
        throw new DomainError(
          ErrorCode.ORGANIZATION_NOT_FOUND,
          "Organization not found",
        );
      }

      return organisation.toPersistence();
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(_input: unknown): Promise<void> {}
}
