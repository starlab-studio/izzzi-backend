import { IUseCase, BaseUseCase, ILoggerService } from "src/core";

import { IOrganization } from "../../domain/types";
import { OrganizationDomainService } from "../../domain/services/organization.domain.service";
import { IOrganizationRepository } from "../../domain/repositories/organization.repository";

export class GetOrganizationUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly organizationDomainService: OrganizationDomainService,
    private readonly organizationRepository: IOrganizationRepository
  ) {
    super(logger);
  }
  async execute(organizationId: string): Promise<IOrganization> {
    try {
      const organisation =
        await this.organizationRepository.findById(organizationId);
      this.organizationDomainService.validateOrganizationExists(organisation);
      return organisation as IOrganization;
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompenstation(input: any): Promise<void> {}
}
