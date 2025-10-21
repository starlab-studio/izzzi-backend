import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { IUser, UserStatus } from "../../domain/types";

@Entity()
export class User implements IUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ type: "varchar", nullable: true })
  avatarUrl?: string;

  @Column({ type: "timestamp", nullable: true })
  lastLogin?: Date;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
