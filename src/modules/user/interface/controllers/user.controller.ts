import { Controller } from "@nestjs/common";

import { UserService } from "../../application/services/user.service";

@Controller("users")
export class UserController {
  constructor(private readonly service: UserService) {}
}
