import { Repository, LessThan } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable } from "@nestjs/common";

import { IPasswordResetToken } from "../../domain/types";
import { PasswordResetTokenModel } from "../models/passwordResetToken.model";
import { IPasswordResetTokenRepository } from "../../domain/repositories/passwordResetToken.repository";
import { PasswordResetToken } from "../../domain/entities/passwordResetToken.entity";

@Injectable()
export class PasswordResetTokenRepository
  implements IPasswordResetTokenRepository
{
  constructor(
    @InjectRepository(PasswordResetTokenModel)
    private ormRepository: Repository<IPasswordResetToken>
  ) {}

  async save(token: PasswordResetToken): Promise<void> {
    const data = token.toPersistence();
    await this.ormRepository.save(data);
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { tokenHash },
    });

    if (!ormEntity) return null;
    return PasswordResetToken.reconstitute(ormEntity);
  }

  async findByEmailAndNotUsed(
    email: string
  ): Promise<PasswordResetToken | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: {
        email,
        isUsed: false,
      },
      order: {
        createdAt: "DESC",
      },
    });

    if (!ormEntity) return null;
    return PasswordResetToken.reconstitute(ormEntity);
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
