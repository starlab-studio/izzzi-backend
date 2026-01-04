import { IRepository } from "src/core";
import { AuthIdentityName } from "../types";
import { AuthIdentityEntity } from "../entities/authIdentity.entity";

export interface IAuthIdentityRepository
  extends IRepository<AuthIdentityEntity> {
  create(entity: AuthIdentityEntity): Promise<AuthIdentityEntity>;
  findByUsername(username: string): Promise<AuthIdentityEntity | null>;
  findByProviderAndUsername(
    provider: AuthIdentityName,
    username: string
  ): Promise<AuthIdentityEntity | null>;
  findByProviderAndProviderUserId(
    provider: AuthIdentityName,
    providerUserId: string
  ): Promise<AuthIdentityEntity | null>;
  findAllByUserId(userId: string): Promise<AuthIdentityEntity[]>;
  deleteByUsername(username: string): Promise<void>;
}
