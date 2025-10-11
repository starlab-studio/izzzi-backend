import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { IAuthIdentity } from "../../domain/types";

@Entity()
export class AuthIdentity implements IAuthIdentity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  provider: string;

  @Column()
  provider_user_id: string;

  @Column({ type: "uuid", nullable: true })
  user_id: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
