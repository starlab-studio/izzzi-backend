import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { IAuthIdentity } from "../../domain/types";
import { AuthIdentity } from "../models/authIdentity.model";
import { IAuthIdentityRepository } from "../../domain/repositories/authIdentity.repository";

export class AuthIdentityRepository implements IAuthIdentityRepository {
  constructor(
    @InjectRepository(AuthIdentity)
    private ormRepository: Repository<AuthIdentity>
  ) {}

  async create(data: Partial<AuthIdentity>): Promise<IAuthIdentity> {
    const entity = this.ormRepository.create({
      provider: data.provider,
      providerUserId: data.providerUserId,
    });

    return await this.ormRepository.save(entity);
  }

  async findById(id: string): Promise<IAuthIdentity | null> {
    return await this.ormRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<IAuthIdentity[]> {
    return await this.ormRepository.find();
  }

  async update(
    id: string,
    entity: Pick<IAuthIdentity, "provider" | "providerUserId">
  ): Promise<IAuthIdentity> {
    await this.ormRepository.update(id, entity);
    return (await this.findById(id)) as IAuthIdentity;
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }
}
