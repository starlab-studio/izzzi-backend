import { IClass, IClassCreate } from "../../domain/types";
import { CreateClassUseCase } from "../use-cases/CreateClass.use-case";
import { GetClassesByOrganizationUseCase } from "../use-cases/GetClassesByOrganization.use-case";
import { GetClassByIdUseCase } from "../use-cases/GetClassById.use-case";
import { UpdateClassUseCase } from "../use-cases/UpdateClass.use-case";
import { ArchiveClassUseCase } from "../use-cases/ArchiveClass.use-case";

export class ClassFacade {
  constructor(
    private readonly createClassUseCase: CreateClassUseCase,
    private readonly getClassesByOrganizationUseCase: GetClassesByOrganizationUseCase,
    private readonly getClassByIdUseCase: GetClassByIdUseCase,
    private readonly updateClassUseCase: UpdateClassUseCase,
    private readonly archiveClassUseCase: ArchiveClassUseCase,
  ) {}

  async createClass(data: IClassCreate, userEmail: string): Promise<IClass> {
    try {
      return await this.createClassUseCase.execute({
        ...data,
        userEmail,
      });
    } catch (error) {
      throw error;
    }
  }

  async getClassesByOrganization(
    organizationId: string,
    userId: string,
    archived?: boolean,
  ): Promise<IClass[]> {
    try {
      return await this.getClassesByOrganizationUseCase.execute({
        organizationId,
        userId,
        archived,
      });
    } catch (error) {
      throw error;
    }
  }

  async getClassById(
    classId: string,
    organizationId: string,
    userId: string,
  ): Promise<IClass> {
    try {
      return await this.getClassByIdUseCase.execute({
        classId,
        organizationId,
        userId,
      });
    } catch (error) {
      throw error;
    }
  }

  async updateClass(
    classId: string,
    organizationId: string,
    userId: string,
    data: {
      name?: string;
      description?: string | null;
      numberOfStudents?: number;
      studentEmails?: string;
    },
  ): Promise<IClass> {
    try {
      return await this.updateClassUseCase.execute({
        classId,
        organizationId,
        userId,
        ...data,
      });
    } catch (error) {
      throw error;
    }
  }

  async archiveClass(
    classId: string,
    organizationId: string,
    userId: string,
  ): Promise<IClass> {
    try {
      return await this.archiveClassUseCase.execute({
        classId,
        organizationId,
        userId,
      });
    } catch (error) {
      throw error;
    }
  }
}
