import { Controller } from "@nestjs/common";

import { UserFacade } from "../../application/facades/user.facade";

@Controller("v1/users")
export class UserController {
  constructor(private readonly facade: UserFacade) {}
}
