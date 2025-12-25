import { IRepository } from "src/core";
import { ClassEntity } from "../entities/class.entity";

export interface IClassRepository extends IRepository<ClassEntity> {
  create(data: ClassEntity): Promise<ClassEntity>;
  findByNameAndOrganization(
    name: string,
    organizationId: string
  ): Promise<ClassEntity | null>;
  findByCode(code: string): Promise<ClassEntity | null>;
  findByOrganization(organizationId: string): Promise<ClassEntity[]>;
  findByOrganizationAndStatus(
    organizationId: string,
    status: "active" | "archived"
  ): Promise<ClassEntity[]>;
  findByUser(userId: string): Promise<ClassEntity[]>;
  countByOrganization(organizationId: string): Promise<number>;
}
