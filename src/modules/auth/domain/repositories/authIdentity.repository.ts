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
  deleteByUsername(username: string): Promise<void>;
}
