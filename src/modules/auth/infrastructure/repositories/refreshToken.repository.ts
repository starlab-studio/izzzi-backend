import { Repository, LessThan, MoreThan } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable } from "@nestjs/common";

import { IRefreshToken } from "../../domain/types";
import { RefreshTokenModel } from "../models/refreshToken.model";
import { IRefreshTokenRepository } from "../../domain/repositories/refreshToken.repository";
import { RefreshToken } from "../../domain/entities/refreshToken.entity";

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenModel)
    private ormRepository: Repository<IRefreshToken>
  ) {}

  async save(token: RefreshToken): Promise<void> {
    const data = token.toPersistence();
    await this.ormRepository.save(data);
  }

  async findById(id: string): Promise<RefreshToken | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
    });

    if (!ormEntity) return null;
    return RefreshToken.reconstitute(ormEntity);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { tokenHash },
    });

    if (!ormEntity) return null;
    return RefreshToken.reconstitute(ormEntity);
  }

  async findActiveByUserId(userId: string): Promise<RefreshToken[]> {
    const ormEntities = await this.ormRepository.find({
      where: {
        userId,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      order: {
        createdAt: "DESC",
      },
    });

    return ormEntities.map((entity) => RefreshToken.reconstitute(entity));
  }

  async countActiveByUserId(userId: string): Promise<number> {
    return await this.ormRepository.count({
      where: {
        userId,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.ormRepository.update(
      {
        userId,
        isRevoked: false,
      },
      {
        isRevoked: true,
        revokedAt: new Date(),
      }
    );
  }

  async deleteExpired(): Promise<number> {
    const result = await this.ormRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete({ id });
  }
}
