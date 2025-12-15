import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  ErrorCode,
  UserRole,
  DomainError,
} from "src/core";
import { IClass } from "../../domain/types";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export class ArchiveClassUseCase extends BaseUseCase implements IUseCase {
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
      await this.organizationFacade.validateUserCanCreateClass(
        data.userId,
        data.organizationId,
        [UserRole.LEARNING_MANAGER, UserRole.ADMIN],
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

      if (!classEntity.isActive) {
        throw new DomainError(
          ErrorCode.CLASS_ALREADY_ARCHIVED,
          "Class is already archived",
        );
      }

      classEntity.archive();

      const archivedClass = await this.classRepository.save(classEntity);

      return archivedClass.toPersistence();
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

