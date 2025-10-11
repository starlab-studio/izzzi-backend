import { IRepository } from "src/core";
import { IAuthIdentity } from "../types";

export interface IAuthIdentityRepository extends IRepository<IAuthIdentity> {
  create(entity: Partial<IAuthIdentity>): Promise<IAuthIdentity>;
}
