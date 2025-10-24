import { IUser } from "../types";
import { IRepository } from "src/core";

export interface IUserRepository extends IRepository<IUser> {
  create(data: IUser): Promise<IUser>;
  findByEmail(email: string): Promise<IUser | null>;
}
