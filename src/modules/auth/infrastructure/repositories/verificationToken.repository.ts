import { Repository, LessThan } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable } from "@nestjs/common";

import { IVerificationToken, VerificationTokenType } from "../../domain/types";
import { VerificationTokenModel } from "../models/verificationToken.model";
import { IVerificationTokenRepository } from "../../domain/repositories/verificationToken.repository";
import { VerificationTokenEntity } from "../../domain/entities/verificationToken.entity";

@Injectable()
export class VerificationTokenRepository
  implements IVerificationTokenRepository
{
  constructor(
    @InjectRepository(VerificationTokenModel)
    private ormRepository: Repository<IVerificationToken>,
  ) {}

  async create(
    entity: VerificationTokenEntity,
  ): Promise<VerificationTokenEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.ormRepository.create(data);

    const saved = await this.ormRepository.save(ormEntity);
    return VerificationTokenEntity.reconstitute(saved);
  }

  async findByEmailAndType(
    email: string,
    type: VerificationTokenType,
  ): Promise<VerificationTokenEntity | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: {
        email,
        type,
        isUsed: false,
      },
      order: {
        createdAt: "DESC",
      },
    });

    if (!ormEntity) return null;
    return VerificationTokenEntity.reconstitute(ormEntity);
  }

  async save(
    entity: VerificationTokenEntity,
  ): Promise<VerificationTokenEntity> {
    const data = entity.toPersistence();
    const ormEntity = await this.ormRepository.save(data);

    return VerificationTokenEntity.reconstitute(ormEntity);
  }

  async findByToken(token: string): Promise<VerificationTokenEntity | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { token },
    });

    if (!ormEntity) return null;
    return VerificationTokenEntity.reconstitute(ormEntity);
  }

  async deleteExpired(): Promise<void> {
    await this.ormRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async deleteByEmailAndType(
    email: string,
    type: VerificationTokenType,
  ): Promise<void> {
    await this.ormRepository.delete({ email, type });
  }
}
