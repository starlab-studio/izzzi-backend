import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ErrorCode,
  UserRole,
  DomainError,
  Email,
} from "src/core";
import { IClass, UpdateClassInput } from "../../domain/types";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { IClassStudentRepository } from "../../domain/repositories/class-student.repository";
import { ClassStudentEntity } from "../../domain/entities/class-student.entity";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { GeneralUtils } from "src/utils/general.utils";

export class UpdateClassUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly classRepository: IClassRepository,
    private readonly classStudentRepository: IClassStudentRepository,
    private readonly organizationFacade: OrganizationFacade
  ) {
    super(logger);
  }

  async execute(data: UpdateClassInput): Promise<IClass> {
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
          "Cannot update an archived class"
        );
      }

      // Vérifie si le nom existe déjà dans l'organisation (uniquement si le nom change)
      if (data.name && data.name !== classEntity.name) {
        const existingClass =
          await this.classRepository.findByNameAndOrganization(
            data.name,
            data.organizationId
          );

        if (existingClass && existingClass.id !== data.classId) {
          throw new DomainError(
            ErrorCode.CLASS_ALREADY_EXISTS,
            "A class with this name already exists in this organization"
          );
        }
      }

      const updateData: {
        name?: string;
        description?: string | null;
        numberOfStudents?: number;
        studentEmails?: string[];
      } = {};

      if (data.name !== undefined) {
        updateData.name = data.name;
      }

      if (data.description !== undefined) {
        updateData.description = data.description;
      }

      if (data.numberOfStudents !== undefined) {
        updateData.numberOfStudents = data.numberOfStudents;
      }

      if (data.studentEmails !== undefined) {
        const emailStrings = GeneralUtils.parseEmails(data.studentEmails);
        const validatedEmails = emailStrings.map((emailString) => {
          const email = Email.create(emailString);
          return email.value;
        });
        updateData.studentEmails = validatedEmails;

        // Met à jour les étudiants : désactive ceux qui ne sont plus dans la liste
        const existingStudents = await this.classStudentRepository.findByClass(
          data.classId
        );
        new Set(existingStudents.map((s) => s.email.toLowerCase()));
        const newEmails = new Set(validatedEmails.map((e) => e.toLowerCase()));

        for (const student of existingStudents) {
          if (!newEmails.has(student.email.toLowerCase())) {
            student.deactivate();
            await this.classStudentRepository.save(student);
          }
        }

        // Crée de nouveaux étudiants ou réactive ceux qui existent déjà
        for (const email of validatedEmails) {
          const existingStudent =
            await this.classStudentRepository.findByEmailAndClass(
              email,
              data.classId
            );

          if (existingStudent) {
            if (!existingStudent.isActive) {
              existingStudent.activate();
              await this.classStudentRepository.save(existingStudent);
            }
          } else {
            const newStudent = ClassStudentEntity.create({
              classId: data.classId,
              email,
              isActive: true,
            });
            await this.classStudentRepository.create(newStudent);
          }
        }
      }

      classEntity.update(updateData);
      const updatedClass = await this.classRepository.save(classEntity);

      return updatedClass.toPersistence();
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
