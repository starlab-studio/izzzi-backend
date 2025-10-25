import { Repository } from "typeorm";
import { IUnitOfWork, BaseTransactionalRepository } from "src/core";

import { IUser } from "../../domain/types";
import { UserModel } from "../models/user.model";
import { IUserRepository } from "../../domain/repositories/user.repository";

export class UserRepository
  extends BaseTransactionalRepository<IUser>
  implements IUserRepository
{
  constructor(unitOfWork: IUnitOfWork) {
    super(unitOfWork);
  }

  private getTypeOrmRepository(): Repository<UserModel> {
    // Cast vers TypeOrmUnitOfWork pour accéder à l'EntityManager
    const typeOrmUow = this.unitOfWork as any;
    return typeOrmUow.getEntityManager().getRepository(UserModel);
  }

  async create(data: IUser): Promise<IUser> {
    const repository = this.getTypeOrmRepository();
    const entity = repository.create(data);
    return await repository.save(entity);
  }

  async findById(id: string): Promise<IUser | null> {
    const repository = this.getTypeOrmRepository();
    return await repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const repository = this.getTypeOrmRepository();
    return await repository.findOne({ where: { email } });
  }

  async findAll(): Promise<IUser[]> {
    const repository = this.getTypeOrmRepository();
    return await repository.find();
  }

  async update(id: string, entity: IUser): Promise<IUser> {
    const repository = this.getTypeOrmRepository();
    await repository.update(id, entity);
    return (await this.findById(id)) as IUser;
  }

  async delete(id: string): Promise<void> {
    const repository = this.getTypeOrmRepository();
    await repository.delete(id);
  }

  async save(entity: IUser): Promise<IUser> {
    const repository = this.getTypeOrmRepository();
    return await repository.save(entity);
  }
}
