import { Entity, Column } from "typeorm";

import { BaseModel } from "src/core";
import { IUser, UserStatus } from "../../domain/types";

@Entity({ name: "users" })
export class UserModel extends BaseModel implements IUser {
  @Column({ name: "first_name", type: "varchar", length: 50 })
  firstName: string;

  @Column({ name: "last_name", type: "varchar", length: 50 })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: "phone_number", type: "varchar", length: 25, nullable: true })
  phoneNumber?: string;

  @Column({ name: "avatar_url", type: "varchar", length: 255, nullable: true })
  avatarUrl?: string;

  @Column({ name: "last_login", type: "timestamp", nullable: true })
  lastLogin?: Date;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;
}
