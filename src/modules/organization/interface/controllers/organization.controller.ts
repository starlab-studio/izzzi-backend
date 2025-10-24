import { Controller } from "@nestjs/common";

import { OrganizationFacade } from "../../application/facades/organization.facade";

@Controller("v1/organizations")
export class OrganizationController {
  constructor(private readonly facade: OrganizationFacade) {}
}
