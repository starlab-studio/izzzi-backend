import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ApplicationError,
  EventStore,
  ErrorCode,
} from "src/core";

import { IOrganization, IOrganizationCreate } from "../../domain/types";
import { OrganizationCreatedEvent } from "../../domain/events/organizationCreated.event";
import { IOrganizationRepository } from "../../domain/repositories/organization.repository";
import { OrganizationEntity } from "../../domain/entities/organization.entity";

export class CreateOrganizationUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly eventStore: EventStore,
    private readonly organizationRepository: IOrganizationRepository,
  ) {
    super(logger);
  }

  async execute(
    data: Pick<IOrganizationCreate, "name" | "ownerId">,
  ): Promise<IOrganization> {
    try {
      const existingOrganization = await this.organizationRepository.findByName(
        data.name,
      );

      if (existingOrganization) {
        throw new DomainError(
          ErrorCode.ORGANIZATION_ALREADY_EXIST,
          "Organization name is not available",
        );
      }

      const organisation = OrganizationEntity.create({ ...data });
      const createdOrganization =
        await this.organizationRepository.create(organisation);
      if (!createdOrganization) {
        throw new ApplicationError(
          ErrorCode.APPLICATION_FAILED_TO_CREATE,
          "Something went wrong during creation. Please try again later.",
        );
      }

      this.eventStore.publish(
        new OrganizationCreatedEvent(createdOrganization),
      );
      return createdOrganization;
    } catch (error) {
      this.handleError(error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async withCompensation(_input: IOrganization): Promise<void> {}
}
