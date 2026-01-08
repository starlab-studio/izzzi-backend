import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import { UpdateSubjectInput, UpdateSubjectOutput } from "../../domain/types";
import { ISubjectRepository } from "../../domain/repositories/subject.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export class UpdateSubjectUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly subjectRepository: ISubjectRepository,
    private readonly organizationFacade: OrganizationFacade
  ) {
    super(logger);
  }

  async execute(data: UpdateSubjectInput): Promise<UpdateSubjectOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId
      );

      const subjectEntity = await this.subjectRepository.findById(
        data.subjectId
      );
      if (!subjectEntity) {
        throw new DomainError(ErrorCode.SUBJECT_NOT_FOUND, "Subject not found");
      }

      if (subjectEntity.organizationId !== data.organizationId) {
        throw new DomainError(
          ErrorCode.UNAUTHORIZED_ACCESS,
          "Unauthorized access to subject"
        );
      }
      const updateData: {
        name?: string;
        instructorName?: string | null;
        instructorEmail?: string | null;
        firstCourseDate?: Date | null;
        lastCourseDate?: Date | null;
      } = {};

      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.instructorName !== undefined) {
        updateData.instructorName = data.instructorName;
      }
      if (data.instructorEmail !== undefined) {
        updateData.instructorEmail = data.instructorEmail;
      }
      if (data.firstCourseDate !== undefined) {
        updateData.firstCourseDate = data.firstCourseDate
          ? new Date(data.firstCourseDate)
          : null;
      }
      if (data.lastCourseDate !== undefined) {
        updateData.lastCourseDate = data.lastCourseDate
          ? new Date(data.lastCourseDate)
          : null;
      }

      subjectEntity.update(updateData);
      const updatedSubject = await this.subjectRepository.save(subjectEntity);

      return {
        subject: updatedSubject.toPersistence(),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
