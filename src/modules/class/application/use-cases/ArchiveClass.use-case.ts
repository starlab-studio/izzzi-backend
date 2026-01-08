import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ErrorCode,
  UserRole,
  DomainError,
  IEventStore,
} from "src/core";
import { IClass, ArchiveClassInput } from "../../domain/types";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { ClassArchivedEvent } from "../../domain/events/classArchived.event";

export class ArchiveClassUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly classRepository: IClassRepository,
    private readonly organizationFacade: OrganizationFacade,
    private readonly eventStore: IEventStore
  ) {
    super(logger);
  }

  async execute(data: ArchiveClassInput): Promise<IClass> {
    try {
      await this.organizationFacade.validateUserCanCreateClass(
        data.userId,
        data.organizationId,
        [UserRole.LEARNING_MANAGER, UserRole.ADMIN]
      );

      const classEntity = await this.classRepository.findById(data.classId);

      if (!classEntity) {
        throw new DomainError(ErrorCode.CLASS_NOT_FOUND, "Class not found");
      }

      if (classEntity.organizationId !== data.organizationId) {
        throw new DomainError(
          ErrorCode.UNAUTHORIZED_ROLE,
          "Class does not belong to this organization"
        );
      }

      if (classEntity.status === "archived") {
        throw new DomainError(
          ErrorCode.CLASS_ALREADY_ARCHIVED,
          "Class is already archived"
        );
      }

      classEntity.archive();

      const archivedClass = await this.classRepository.save(classEntity);

      this.eventStore.publish(
        new ClassArchivedEvent({
          id: archivedClass.id,
          name: archivedClass.name,
          code: archivedClass.code,
          description: archivedClass.description,
          organizationId: archivedClass.organizationId,
          userId: archivedClass.userId,
          userEmail: data.userEmail,
        })
      );

      return archivedClass.toPersistence();
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
