import { IRepository } from "src/core";
import { Class } from "../entities/class.entity";

export interface IClassRepository extends IRepository<Class> {
  create(data: Class): Promise<Class>;
  findByName(name: string, organizationId: string): Promise<Class | null>;
  findByCode(code: string): Promise<Class | null>;
  findByOrganization(organizationId: string): Promise<Class[]>;
  findByUser(userId: string): Promise<Class[]>;
}
