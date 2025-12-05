import { IRepository } from "src/core";
import { SubjectEntity } from "../entities/subject.entity";

export interface ISubjectRepository extends IRepository<SubjectEntity> {
  create(entity: SubjectEntity): Promise<SubjectEntity>;
  findById(id: string): Promise<SubjectEntity | null>;
  findByName(
    name: string,
    organizationId: string,
  ): Promise<SubjectEntity | null>;
  findByOrganization(organizationId: string): Promise<SubjectEntity[]>;
  findByUser(userId: string): Promise<SubjectEntity[]>;
  findAll(): Promise<SubjectEntity[]>;
  delete(id: string): Promise<void>;
  save(entity: SubjectEntity): Promise<SubjectEntity>;
}
