import { Entity, Column, PrimaryColumn, OneToMany } from "typeorm";

import { IUser, UserStatus } from "../../domain/types";
import { MembershipModel } from "./membership.model";

@Entity({ name: "users" })
export class UserModel implements IUser {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "first_name", type: "varchar", length: 50 })
  firstName: string;

  @Column({ name: "last_name", type: "varchar", length: 50 })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: "phone_number", type: "varchar", length: 25, nullable: true })
  phoneNumber: string | null;

  @Column({ name: "avatar_url", type: "varchar", length: 255, nullable: true })
  avatarUrl: string | null;

  @Column({ name: "last_login", type: "timestamp", nullable: true })
  lastLogin: Date | null;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;

  @OneToMany(() => MembershipModel, (membership) => membership.user, {
    cascade: false,
  })
  memberships: MembershipModel[];
}
