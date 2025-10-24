import { IUserCreate } from "../../domain/types";
import { OrganizationService } from "../services/organization.service";

export class OrganizationFacade {
  constructor(private readonly organizationService: OrganizationService) {}

  async createUserAndOrganization(data: IUserCreate) {
    return await this.organizationService.createUserAndOrganization(data);
  }
}
