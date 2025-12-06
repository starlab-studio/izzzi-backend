import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";

import { IOrganization } from "../../domain/types";
import { IOrganizationRepository } from "../../domain/repositories/organization.repository";

export class GetOrganizationUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly organizationRepository: IOrganizationRepository
  ) {
    super(logger);
  }
  async execute(organizationId: string): Promise<IOrganization> {
    try {
      const organisation =
        await this.organizationRepository.findById(organizationId);

      if (!organisation) {
        throw new DomainError(
          ErrorCode.ORGANIZATION_NOT_FOUND,
          "Organization not found"
        );
      }

      return organisation.toPersistence();
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: any): Promise<void> {}
}
