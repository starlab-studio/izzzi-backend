import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  ErrorCode,
  Role,
  DomainError,
} from "src/core";

import { ISubject, ISubjectCreate } from "../../domain/types";
import { ISubjectRepository } from "../../domain/repositories/subject.repository";
import { IMembershipRepository } from "src/modules/organization/domain/repositories/membership.repository";
import { SubjectEntity } from "../../domain/entities/subject.entity";

export class CreateSubjectUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly subjectRepository: ISubjectRepository,
    private readonly membershipRepository: IMembershipRepository,
  ) {
    super(logger);
  }

  async execute(data: ISubjectCreate): Promise<ISubject> {
    try {
      const membership =
        await this.membershipRepository.findByUserAndOrganization(
          data.createdBy,
          data.organizationId,
        );
      if (!membership || membership.role !== Role.LEARNING_MANAGER) {
        throw new DomainError(
          ErrorCode.SUBJECT_CREATION_FORBIDDEN,
          "You must have the LEARNING_MANAGER role to create a subject",
        );
      }

      const subject = SubjectEntity.create(data);
      const createdSubject = await this.subjectRepository.create(subject);

      if (!createdSubject) {
        throw new ApplicationError(
          ErrorCode.APPLICATION_FAILED_TO_CREATE,
          "An error occurred while creating the subject. Please try again later.",
        );
      }

      return createdSubject;
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
