import { IRepository } from "src/core";
import { IClass } from "../types";

export interface IClassRepository extends IRepository<IClass> {
  create(data: IClass): Promise<IClass>;
  findByName(name: string, organizationId: string): Promise<IClass | null>;
  findByCode(code: string): Promise<IClass | null>;
  findByOrganization(organizationId: string): Promise<IClass[]>;
  findByUser(userId: string): Promise<IClass[]>;
}
