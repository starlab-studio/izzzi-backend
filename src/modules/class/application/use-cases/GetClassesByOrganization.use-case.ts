import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
} from "src/core";

import { IClass } from "../../domain/types";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { ClassEntity } from "../../domain/entities/class.entity";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export interface GetClassesByOrganizationInput {
  organizationId: string;
  userId: string;
  archived?: boolean;
}

export class GetClassesByOrganizationUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly classRepository: IClassRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(data: GetClassesByOrganizationInput): Promise<IClass[]> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      let classes: ClassEntity[];
      if (data.archived !== undefined) {
        classes = await this.classRepository.findByOrganizationAndStatus(
          data.organizationId,
          !data.archived, // isActive = !archived
        );
      } else {
        classes = await this.classRepository.findByOrganization(data.organizationId);
      }
      
      return classes.map((classEntity) => classEntity.toPersistence());
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

