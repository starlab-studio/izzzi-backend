import { IRepository } from "src/core";
import { IMembership, IMembershipCreate } from "../types";

export interface IMembershipRepository extends IRepository<IMembership> {
  create(data: IMembershipCreate): Promise<IMembership>;
  findByUser(userId: string): Promise<IMembership[]>;
  findByOrganization(organizationId: string): Promise<IMembership[] | []>;
  findByUserAndOrganization(
    userId: string,
    organizationId: string
  ): Promise<IMembership | null>;
}
