import { IRepository } from "src/core";
import { UserEntity } from "../entities/user.entity";

export interface IUserRepository extends IRepository<UserEntity> {
  create(data: UserEntity): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByIdWithActiveMemberships(userId: string): Promise<UserEntity | null>;
  findByEmailWithActiveMemberships(email: string): Promise<UserEntity | null>;
  findByEmailWithMemberships(email: string): Promise<UserEntity | null>;
}
