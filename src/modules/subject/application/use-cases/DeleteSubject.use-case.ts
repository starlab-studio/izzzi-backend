import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import { ISubjectRepository } from "../../domain/repositories/subject.repository";
import { ISubjectAssignmentRepository } from "../../domain/repositories/subject-assignment.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export interface DeleteSubjectInput {
  subjectId: string;
  organizationId: string;
  userId: string;
}

export class DeleteSubjectUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly subjectRepository: ISubjectRepository,
    private readonly subjectAssignmentRepository: ISubjectAssignmentRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(data: DeleteSubjectInput): Promise<void> {
    try {
      // Validate user belongs to organization
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      // Get subject
      const subjectEntity = await this.subjectRepository.findById(data.subjectId);
      if (!subjectEntity) {
        throw new DomainError(ErrorCode.SUBJECT_NOT_FOUND, "Subject not found");
      }

      // Verify subject belongs to organization
      if (subjectEntity.organizationId !== data.organizationId) {
        throw new DomainError(ErrorCode.UNAUTHORIZED_ACCESS, "Unauthorized access to subject");
      }

      // Delete all assignments for this subject
      const assignments = await this.subjectAssignmentRepository.findBySubject(data.subjectId);
      for (const assignment of assignments) {
        await this.subjectAssignmentRepository.remove(assignment.subjectId, assignment.classId);
      }

      // Delete the subject
      await this.subjectRepository.delete(data.subjectId);
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

