import { IRepository } from "src/core";
import { IOrganization } from "../types";

export interface IOrganizationRepository extends IRepository<IOrganization> {
  create(data: Pick<IOrganization, "name" | "owner">): Promise<IOrganization>;
  findByOwner(ownerId: string): Promise<IOrganization | null>;
}
