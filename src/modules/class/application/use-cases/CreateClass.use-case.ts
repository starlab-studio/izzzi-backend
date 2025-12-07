import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  ErrorCode,
  Email,
} from "src/core";

import { Class } from "../../domain/entities/class.entity";
import { IClass, IClassCreate } from "../../domain/types";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { ClassDomainService } from "../../domain/services/class.domain.service";
import { GeneralUtils } from "src/utils/general.utils";
import { IMembershipRepository } from "src/modules/organization/domain/repositories/membership.repository";

export class CreateClassUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly classDomainService: ClassDomainService,
    private readonly classRepository: IClassRepository,
    private readonly membershipRepository: IMembershipRepository,
  ) {
    super(logger);
  }

  async execute(data: IClassCreate): Promise<IClass> {
    try {

      const membership =
        await this.membershipRepository.findByUserAndOrganization(
          data.userId,
          data.organizationId,
        );
      this.classDomainService.validateUserCanCreateClass(
        membership ? membership.toPersistance() : null,
      );


      const existingClass = await this.classRepository.findByName(
        data.name,
        data.organizationId,
      );
      this.classDomainService.validateClassUniqueness(
        existingClass ? existingClass.toPersistence() : null,
      );

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
        data.userId,
      );

      const createdClass = await this.classRepository.create(classEntity);
      if (!createdClass) {
        throw new ApplicationError(
          ErrorCode.APPLICATION_FAILED_TO_CREATE,
          "Failed to create class. Please try again later.",
        );
      }

      return createdClass.toPersistence();
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(input: IClass): Promise<void> {}
}
