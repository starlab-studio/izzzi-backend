import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  ErrorCode,
} from "src/core";

import { Class } from "../../domain/entities/class.entity";
import { IClass, IClassCreate } from "../../domain/types";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { ClassDomainService } from "../../domain/services/class.domain.service";
import { Email } from "src/modules/auth/domain/value-objects/email.vo";
import { GeneralUtils } from "src/utils/general.utils";

export class CreateClassUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly classDomainService: ClassDomainService,
    private readonly classRepository: IClassRepository
  ) {
    super(logger);
  }

  async execute(data: IClassCreate): Promise<IClass> {
    try {
      const existingClass = await this.classRepository.findByName(
        data.name,
        data.organizationId
      );
      this.classDomainService.validateClassUniqueness(existingClass);

      const emailStrings = GeneralUtils.parseEmails(data.studentEmails);

      const validatedEmails = emailStrings.map((emailString) => {
        const email = Email.create(emailString);
        return email.value;
      });

      const classEntity = Class.create(
        data.name,
        data.description ?? null,
        data.numberOfStudents,
        validatedEmails,
        data.organizationId,
        data.userId
      );

      const createdClass = await this.classRepository.create(classEntity);

      if (!createdClass) {
        throw new ApplicationError(
          ErrorCode.APPLICATION_FAILED_TO_CREATE,
          "Failed to create class. Please try again later."
        );
      }

      return createdClass.toPersistence();
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: IClass): Promise<void> {}
}
