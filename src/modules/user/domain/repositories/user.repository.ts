import { IUser, IUserCreate } from "../types";
import { IRepository } from "src/core";

export interface IUserRepository extends IRepository<IUser> {
  create(data: IUserCreate): Promise<IUser>;
  findByEmail(email: string): Promise<IUser | null>;
}
