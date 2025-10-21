import { ILoggerService } from "src/core";
import { CreateUserUseCase } from "../use-cases/CreateUser.use-case";
import { CreateOrganizationUseCase } from "../use-cases/CreateOrganization.use-case";
import { IUserCreate, IUser } from "../../domain/types";

export class OrganizationService {
  constructor(
    readonly loagger: ILoggerService,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly createOrganizationUseCase: CreateOrganizationUseCase
  ) {}

  async createUserAndOrganization(data: IUserCreate): Promise<IUser> {
    const user = await this.createUserUseCase.execute(data);
    await this.createOrganizationUseCase.execute({
      name: data.organization,
      owner: user.id,
    });
    return user;
  }
}
