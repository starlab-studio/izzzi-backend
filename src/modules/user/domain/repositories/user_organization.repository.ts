import { IRepository } from "src/core";
import { IUserOrganization } from "../types";

export interface IUserOrganizationRepository
  extends IRepository<IUserOrganizationRepository> {
  create(data: IUserOrganizationRepository): Promise<IUserOrganization>;
  findByUser(userId: string): Promise<IUserOrganization | null>;
  findByOrganization(organizationId: string): Promise<IUserOrganization | null>;
  findByUserAndOrganization(
    userId: string,
    organizationId: string
  ): Promise<IUserOrganization | null>;
}
