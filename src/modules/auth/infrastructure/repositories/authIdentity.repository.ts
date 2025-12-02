import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { AuthIdentityName, IAuthIdentity } from "../../domain/types";
import { AuthIdentityEntity } from "../../domain/entities/authIdentity.entity";
import { AuthIdentityModel } from "../models/authIdentity.model";
import { IAuthIdentityRepository } from "../../domain/repositories/authIdentity.repository";

export class AuthIdentityRepository implements IAuthIdentityRepository {
  constructor(
    @InjectRepository(AuthIdentityModel)
    private ormRepository: Repository<IAuthIdentity>
  ) {}

  async create(entity: AuthIdentityEntity): Promise<AuthIdentityEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.ormRepository.create(data);
    const saved = await this.ormRepository.save(ormEntity);

    return AuthIdentityEntity.reconstitute(saved);
  }

  async findById(id: string): Promise<AuthIdentityEntity | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    if (!ormEntity) return null;

    return AuthIdentityEntity.reconstitute(ormEntity);
  }

  async findByUsername(username: string): Promise<AuthIdentityEntity | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { username } });
    if (!ormEntity) return null;

    return AuthIdentityEntity.reconstitute(ormEntity);
  }

  async findByProviderAndUsername(
    provider: AuthIdentityName,
    username: string
  ): Promise<AuthIdentityEntity | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { provider, username },
    });
    if (!ormEntity) return null;

    return AuthIdentityEntity.reconstitute(ormEntity);
  }

  async findAll(): Promise<AuthIdentityEntity[]> {
    const ormEntityList = await this.ormRepository.find();

    return ormEntityList.map((ormEntity) =>
      AuthIdentityEntity.reconstitute(ormEntity)
    );
  }

  async save(entity: AuthIdentityEntity): Promise<AuthIdentityEntity> {
    const data = entity.toPersistence();
    const saved = await this.ormRepository.save(data);

    return AuthIdentityEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }

  async deleteByUsername(username: string): Promise<void> {
    await this.ormRepository.delete({ username });
  }
}
