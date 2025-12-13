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
import { IUserRepository } from "src/modules/organization/domain/repositories/user.repository";
import { ClassCreatedEvent } from "../../domain/events/classCreated.event";

export class CreateClassUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly classRepository: IClassRepository,
    private readonly userRepository: IUserRepository,
    private readonly eventStore: IEventStore,
  ) {
    super(logger);
  }

  async execute(data: IClassCreate & { userEmail: string }): Promise<IClass> {
    try {
      const user = await this.userRepository.findByIdWithActiveMemberships(data.userId);
      if (!user) {
        throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      if (!user.belongsToOrganization(data.organizationId)) {
        throw new DomainError(
          ErrorCode.USER_HAS_NO_ORGANIZATION,
          "User is not a member of this organization",
        );
      }

      if (
        !user.hasAnyRoleInOrganization(data.organizationId, [
          UserRole.LEARNING_MANAGER,
          UserRole.ADMIN,
        ])
      ) {
        throw new DomainError(
          ErrorCode.UNAUTHORIZED_ROLE,
          "User must have LEARNING_MANAGER or ADMIN role to create a class",
        );
      }

      const existingClass = await this.classRepository.findByName(
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
