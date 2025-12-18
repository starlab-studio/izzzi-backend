import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
} from "src/core";

import {
  GetClassesByOrganizationInput,
  ClassListItemResponse,
} from "../../domain/types";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { IClassStudentRepository } from "../../domain/repositories/class-student.repository";
import { ClassEntity } from "../../domain/entities/class.entity";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export class GetClassesByOrganizationUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly classRepository: IClassRepository,
    private readonly classStudentRepository: IClassStudentRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(data: GetClassesByOrganizationInput): Promise<ClassListItemResponse[]> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      let classes: ClassEntity[];
      if (data.archived !== undefined) {
        classes = await this.classRepository.findByOrganizationAndStatus(
          data.organizationId,
          data.archived ? "archived" : "active",
        );
      } else {
        classes = await this.classRepository.findByOrganization(data.organizationId);
      }
      
      // Fetch students for all classes in parallel
      const classesWithStudents = await Promise.all(
        classes.map(async (classEntity) => {
          const classData = classEntity.toPersistence();
          const students = await this.classStudentRepository.findByClassAndActive(
            classEntity.id,
            true,
          );

          return {
            id: classData.id,
            name: classData.name,
            code: classData.code,
            description: classData.description,
            student_count: classData.numberOfStudents,
            status: classData.status,
            created_at: classData.createdAt ? classData.createdAt.toISOString() : new Date().toISOString(),
            updated_at: classData.updatedAt ? classData.updatedAt.toISOString() : new Date().toISOString(),
            archivedAt: classData.archivedAt ? classData.archivedAt.toISOString() : null,
            students: students.map((student) => ({
              id: student.id,
              email: student.email,
            })),
            subjects: [] as Array<never>,
          };
        })
      );

      return classesWithStudents;
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

