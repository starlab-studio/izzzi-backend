import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { IUser, IUserCreate } from "../../domain/types";
import { User } from "../models/user.model";
import { IUserRepository } from "../../domain/repositories/user.repository";

export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private ormRepository: Repository<User>
  ) {}

  async create(data: IUserCreate): Promise<IUser> {
    const entity = this.ormRepository.create(data);
    return await this.ormRepository.save(entity);
  }

  async findById(id: string): Promise<IUser | null> {
    return await this.ormRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await this.ormRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<IUser[]> {
    return await this.ormRepository.find();
  }

  async update(entity: IUser): Promise<IUser> {
    await this.ormRepository.update(entity.id, entity);
    return (await this.findById(entity.id)) as IUser;
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }
}
