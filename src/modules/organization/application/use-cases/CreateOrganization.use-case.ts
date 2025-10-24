import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  EventStore,
  ErrorCode,
} from "src/core";

import { IOrganization, IOrganizationCreate } from "../../domain/types";
import { OrganizationCreatedEvent } from "../../domain/events/organizationCreated.event";
import { OrganizationDomainService } from "../../domain/services/organization.domain.service";
import { IOrganizationRepository } from "../../domain/repositories/organization.repository";

export class CreateOrganizationUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly eventStore: EventStore,
    private readonly organizationDomainService: OrganizationDomainService,
    private readonly organizationRepository: IOrganizationRepository
  ) {
    super(logger);
  }

  async execute(
    data: Pick<IOrganizationCreate, "name" | "ownerId">
  ): Promise<IOrganization> {
    try {
      const existingOrganization = await this.organizationRepository.findByName(
        data.name
      );
      this.organizationDomainService.validateOrganizationUniqueness(
        existingOrganization
      );
      const slug = await this.organizationDomainService.generateUniqueSlug(
        data.name,
        (slug) => this.organizationRepository.findBySlug(slug)
      );

      const createdOrganization = await this.organizationRepository.create({
        ...data,
        slug,
      });
      if (!createdOrganization) {
        throw new ApplicationError(
          ErrorCode.APPLICATION_FAILED_TO_CREATE,
          "Something went wrong during creation. Please try again later."
        );
      }

      this.eventStore.publish(
        new OrganizationCreatedEvent(createdOrganization)
      );
      return createdOrganization;
    } catch (error) {
      this.handleError(error);
    }
  }
}
