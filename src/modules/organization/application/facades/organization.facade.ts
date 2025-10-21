import { IUserCreate } from "../../domain/types";
import { CreateUserUseCase } from "../use-cases/CreateUser.use-case";

export class OrganizationFacade {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async createUser(data: IUserCreate) {
    return this.createUserUseCase.execute(data);
  }
}
