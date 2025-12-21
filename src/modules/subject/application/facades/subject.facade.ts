import {
  ISubject,
  CreateSubjectInput,
  CreateSubjectOutput,
  GetSubjectsByClassInput,
  GetSubjectsByClassOutput,
  UpdateSubjectInput,
  UpdateSubjectOutput,
  DeleteSubjectInput,
  BulkCreateSubjectsInput,
  BulkCreateSubjectsOutput,
} from "../../domain/types";
import { CreateSubjectUseCase } from "../use-cases/CreateSubject.use-case";
import { GetSubjectsByClassUseCase } from "../use-cases/GetSubjectsByClass.use-case";
import { UpdateSubjectUseCase } from "../use-cases/UpdateSubject.use-case";
import { DeleteSubjectUseCase } from "../use-cases/DeleteSubject.use-case";
import { BulkCreateSubjectsUseCase } from "../use-cases/BulkCreateSubjects.use-case";

export class SubjectFacade {
  constructor(
    private readonly createSubjectUseCase: CreateSubjectUseCase,
    private readonly getSubjectsByClassUseCase: GetSubjectsByClassUseCase,
    private readonly updateSubjectUseCase: UpdateSubjectUseCase,
    private readonly deleteSubjectUseCase: DeleteSubjectUseCase,
    private readonly bulkCreateSubjectsUseCase: BulkCreateSubjectsUseCase,
  ) {}

  async createSubject(
    data: CreateSubjectInput,
  ): Promise<CreateSubjectOutput> {
    return await this.createSubjectUseCase.execute(data);
  }

  async getSubjectsByClass(
    data: GetSubjectsByClassInput,
  ): Promise<GetSubjectsByClassOutput> {
    return await this.getSubjectsByClassUseCase.execute(data);
  }

  async updateSubject(
    data: UpdateSubjectInput,
  ): Promise<UpdateSubjectOutput> {
    return await this.updateSubjectUseCase.execute(data);
  }

  async deleteSubject(
    data: DeleteSubjectInput,
  ): Promise<void> {
    return await this.deleteSubjectUseCase.execute(data);
  }

  async bulkCreateSubjects(
    data: BulkCreateSubjectsInput,
  ): Promise<BulkCreateSubjectsOutput> {
    return await this.bulkCreateSubjectsUseCase.execute(data);
  }
}
