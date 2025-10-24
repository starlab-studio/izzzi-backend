import { ILoggerService } from "src/core";
import { Role } from "../../domain/types";
import { CreateUserUseCase } from "../use-cases/CreateUser.use-case";
import { CreateOrganizationUseCase } from "../use-cases/CreateOrganization.use-case";
import { IUserCreate, IUser } from "../../domain/types";
import { AddUserToOrganizationUseCase } from "../use-cases/AddUserToOrganization.use-case";

export class OrganizationService {
  constructor(
    readonly loagger: ILoggerService,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly addUserToOrganizationUseCase: AddUserToOrganizationUseCase
  ) {}

  async createUserAndOrganization(data: IUserCreate): Promise<IUser> {
    const user = await this.createUserUseCase.execute(data);
    const organization = await this.createOrganizationUseCase.execute({
      name: data.organization,
      ownerId: user.id,
    });
    await this.addUserToOrganizationUseCase.execute({
      userId: user.id,
      organizationId: organization.id,
      role: Role.ADMIN,
      addedBy: null,
    });
    return user;
  }
}
