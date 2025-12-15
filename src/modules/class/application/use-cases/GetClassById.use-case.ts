import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  ErrorCode,
  DomainError,
} from "src/core";
import { IClass } from "../../domain/types";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export class GetClassByIdUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly classRepository: IClassRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(data: {
    classId: string;
    organizationId: string;
    userId: string;
  }): Promise<IClass> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      const classEntity = await this.classRepository.findById(data.classId);

      if (!classEntity) {
        throw new DomainError(
          ErrorCode.CLASS_NOT_FOUND,
          "Class not found",
        );
      }

      if (classEntity.organizationId !== data.organizationId) {
        throw new DomainError(
          ErrorCode.UNAUTHORIZED_ROLE,
          "Class does not belong to this organization",
        );
      }

      return classEntity.toPersistence();
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

