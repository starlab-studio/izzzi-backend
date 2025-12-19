import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  ErrorCode,
  DomainError,
} from "src/core";
import {
  IClass,
  IClassStudent,
  GetClassByIdInput,
  ClassDetailResponse,
} from "../../domain/types";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { IClassStudentRepository } from "../../domain/repositories/class-student.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export class GetClassByIdUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly classRepository: IClassRepository,
    private readonly classStudentRepository: IClassStudentRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(data: GetClassByIdInput): Promise<ClassDetailResponse> {
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

      const classData = classEntity.toPersistence();

      const classStudents = await this.classStudentRepository.findByClassAndActive(
        data.classId,
        true,
      );
      return {
        id: classData.id,
        name: classData.name,
        code: classData.code,
        description: classData.description,
        student_count: classData.numberOfStudents,
        status: classData.status,
        created_at: classData.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: classData.updatedAt?.toISOString() || new Date().toISOString(),
        archived_at: classData.archivedAt?.toISOString() || null,
        students: classStudents.map((student) => ({
          id: student.id,
          email: student.email,
        })),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

