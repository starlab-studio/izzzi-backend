import { IRepository } from "src/core";
import { IOrganization, IOrganizationCreate } from "../types";

export interface IOrganizationRepository extends IRepository<IOrganization> {
  create(data: IOrganizationCreate): Promise<IOrganization>;
  findByName(name: string): Promise<IOrganization | null>;
  findBySlug(slug: string): Promise<IOrganization | null>;
  findByOwner(ownerId: string): Promise<IOrganization[] | []>;
}
