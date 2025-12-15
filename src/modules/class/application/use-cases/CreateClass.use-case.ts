import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  ErrorCode,
  Email,
  IEventStore,
  DomainError,
  UserRole,
} from "src/core";

import { ClassEntity } from "../../domain/entities/class.entity";
import { IClass, IClassCreate } from "../../domain/types";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { GeneralUtils } from "src/utils/general.utils";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { ClassCreatedEvent } from "../../domain/events/classCreated.event";

export class CreateClassUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly classRepository: IClassRepository,
    private readonly organizationFacade: OrganizationFacade,
    private readonly eventStore: IEventStore,
  ) {
    super(logger);
  }

  async execute(data: IClassCreate & { userEmail: string }): Promise<IClass> {
    try {
      await this.organizationFacade.validateUserCanCreateClass(
        data.userId,
        data.organizationId,
        [UserRole.LEARNING_MANAGER, UserRole.ADMIN]
      );

      const existingClass = await this.classRepository.findByNameAndOrganization(
        data.name,
        data.organizationId,
      );

      if (existingClass) {
        throw new DomainError(
          ErrorCode.CLASS_ALREADY_EXISTS,
          "A class with this name already exists in this organization",
        );
      }

      const emailStrings = GeneralUtils.parseEmails(data.studentEmails);
      const validatedEmails = emailStrings.map((emailString) => {
        const email = Email.create(emailString);
        return email.value;
      });

      const classEntity = ClassEntity.create(
        data.name,
        data.description ?? null,
        data.numberOfStudents,
        validatedEmails,
        data.organizationId,
        data.userId,
      );

      const createdClass = await this.classRepository.create(classEntity);
      if (!createdClass) {
        throw new ApplicationError(
          ErrorCode.APPLICATION_FAILED_TO_CREATE,
          "Failed to create class. Please try again later.",
        );
      }

      this.eventStore.publish(
        new ClassCreatedEvent({
          id: createdClass.id,
          name: createdClass.name,
          code: createdClass.code,
          description: createdClass.description,
          organizationId: createdClass.organizationId,
          userId: createdClass.userId,
          userEmail: data.userEmail,
        }),
      );

      return createdClass.toPersistence();
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: IClass): Promise<void> {}
}
