import { IRepository } from "src/core";
import { ISubject, ISubjectCreate } from "../types";

export interface ISubjectRepository extends IRepository<ISubject> {
  create(data: ISubjectCreate): Promise<ISubject>;
  findById(id: string): Promise<ISubject | null>;
  findByName(name: string, organizationId: string): Promise<ISubject | null>;
  findByOrganization(organizationId: string): Promise<ISubject[]>;
  findByUser(userId: string): Promise<ISubject[]>;
  findAll(): Promise<ISubject[]>;
  update(id: string, entity: Partial<ISubject>): Promise<ISubject>;
  delete(id: string): Promise<void>;
  save(entity: ISubject): Promise<ISubject>;
}
