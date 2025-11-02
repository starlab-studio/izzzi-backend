import { IRepository } from "src/core";
import { IAuthIdentity } from "../types";

export interface IAuthIdentityRepository extends IRepository<IAuthIdentity> {
  create(entity: Partial<IAuthIdentity>): Promise<IAuthIdentity>;
  findByUsername(username: string): Promise<IAuthIdentity | null>;
  findByProviderAndUsername(
    provider: string,
    username: string
  ): Promise<IAuthIdentity | null>;
  deleteByUsername(username: string): Promise<void>;
}
