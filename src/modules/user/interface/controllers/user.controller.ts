import { Controller } from "@nestjs/common";

import { UserFacade } from "../../application/facades/user.facade";

@Controller("users")
export class UserController {
  constructor(private readonly facade: UserFacade) {}
}
