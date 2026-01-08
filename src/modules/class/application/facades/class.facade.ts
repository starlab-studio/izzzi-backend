import {
  IClass,
  IClassCreate,
  CreateClassInput,
  GetClassesByOrganizationInput,
  ClassListItemResponse,
  GetClassByIdInput,
  ClassDetailResponse,
  UpdateClassInput,
  ArchiveClassInput,
} from "../../domain/types";
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
      const input: CreateClassInput = {
        ...data,
        userEmail,
      };
      return await this.createClassUseCase.execute(input);
    } catch (error) {
      throw error;
    }
  }

  async getClassesByOrganization(
    organizationId: string,
    userId: string,
    archived?: boolean,
  ): Promise<ClassListItemResponse[]> {
    try {
      const input: GetClassesByOrganizationInput = {
        organizationId,
        userId,
        archived,
      };
      return await this.getClassesByOrganizationUseCase.execute(input);
    } catch (error) {
      throw error;
    }
  }

  async getClassById(
    classId: string,
    organizationId: string,
    userId: string,
  ): Promise<ClassDetailResponse> {
    try {
      const input: GetClassByIdInput = {
        classId,
        organizationId,
        userId,
      };
      return await this.getClassByIdUseCase.execute(input);
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
      const input: UpdateClassInput = {
        classId,
        organizationId,
        userId,
        ...data,
      };
      return await this.updateClassUseCase.execute(input);
    } catch (error) {
      throw error;
    }
  }

  async archiveClass(
    classId: string,
    organizationId: string,
    userId: string,
    userEmail: string,
  ): Promise<IClass> {
    try {
      const input: ArchiveClassInput = {
        classId,
        organizationId,
        userId,
        userEmail,
      };
      return await this.archiveClassUseCase.execute(input);
    } catch (error) {
      throw error;
    }
  }
}
