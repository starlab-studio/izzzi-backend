import { ILoggerService, IUnitOfWork } from "src/core";
import { Role } from "../../domain/types";
import { CreateUserUseCase } from "../use-cases/CreateUser.use-case";
import { CreateOrganizationUseCase } from "../use-cases/CreateOrganization.use-case";
import { IUserCreate, IUser } from "../../domain/types";
import { AddUserToOrganizationUseCase } from "../use-cases/AddUserToOrganization.use-case";

export class OrganizationService {
  constructor(
    readonly loagger: ILoggerService,
    private readonly unitOfWork: IUnitOfWork,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly addUserToOrganizationUseCase: AddUserToOrganizationUseCase
  ) {}

  async createUserAndOrganization(
    data: IUserCreate
  ): Promise<IUser | undefined> {
    try {
      return await this.unitOfWork.withTransaction(async (uow) => {
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
      });
    } catch (error) {
      this.createUserUseCase.withCompenstation({
        username: data.email,
        authIdentityId: data.authIdentityId,
      });
    }
  }
}
