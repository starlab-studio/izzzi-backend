import { Controller } from "@nestjs/common";

import { OrganizationFacade } from "../../application/facades/organization.facade";

@Controller("v1/users")
export class UserController {
  constructor(private readonly facade: OrganizationFacade) {}
}
