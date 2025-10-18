import { SignUpData } from "../../domain/types";
import { AuthService } from "../services/auth.service";
import { UserFacade } from "src/modules/user/application/facades/user.facade";

export class AuthFacade {
  constructor(
    private readonly authService: AuthService,
    private readonly userFacade: UserFacade
  ) {}

  async signUp(data: SignUpData) {
    const response = await this.authService.signUp(data);
    return await this.userFacade.createUser(response);
  }
}
