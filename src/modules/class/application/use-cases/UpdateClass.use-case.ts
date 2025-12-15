import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  ErrorCode,
  UserRole,
  DomainError,
  Email,
} from "src/core";
import { IClass } from "../../domain/types";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { GeneralUtils } from "src/utils/general.utils";

export class UpdateClassUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly classRepository: IClassRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(data: {
    classId: string;
    organizationId: string;
    userId: string;
    name?: string;
    description?: string | null;
    numberOfStudents?: number;
    studentEmails?: string;
  }): Promise<IClass> {
    try {
      await this.organizationFacade.validateUserCanCreateClass(
        data.userId,
        data.organizationId,
        [UserRole.LEARNING_MANAGER, UserRole.ADMIN],
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

      if (!classEntity.isActive) {
        throw new DomainError(
          ErrorCode.CLASS_ALREADY_ARCHIVED,
          "Cannot update an archived class",
        );
      }

      // Vérifier si le nom existe déjà (si on change le nom)
      if (data.name && data.name !== classEntity.name) {
        const existingClass = await this.classRepository.findByNameAndOrganization(
          data.name,
          data.organizationId,
        );

        if (existingClass && existingClass.id !== data.classId) {
          throw new DomainError(
            ErrorCode.CLASS_ALREADY_EXISTS,
            "A class with this name already exists in this organization",
          );
        }
      }

      // Préparer les données de mise à jour
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
      }

      // Mettre à jour l'entité
      classEntity.update(updateData);

      // Sauvegarder
      const updatedClass = await this.classRepository.save(classEntity);

      return updatedClass.toPersistence();
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

