import { IRepository } from "src/core";
import { OrganizationEntity } from "../entities/organization.entity";

export interface IOrganizationRepository
  extends IRepository<OrganizationEntity> {
  create(entity: OrganizationEntity): Promise<OrganizationEntity>;
  findByName(name: string): Promise<OrganizationEntity | null>;
  findBySlug(slug: string): Promise<OrganizationEntity | null>;
  findByOwner(ownerId: string): Promise<OrganizationEntity[] | []>;
}
