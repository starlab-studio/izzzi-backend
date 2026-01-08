import { Entity, Column, Index, PrimaryColumn } from "typeorm";

import { VerificationTokenType } from "../../domain/types";

@Entity({ name: "verification_tokens" })
@Index(["token"], { unique: true })
@Index(["email", "type"])
export class VerificationTokenModel {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({ type: "varchar", length: 100 })
  token: string;

  @Column({
    type: "enum",
    enum: VerificationTokenType,
  })
  type: VerificationTokenType;

  @Column({ name: "expires_at", type: "timestamp" })
  expiresAt: Date;

  @Column({ name: "is_used", type: "boolean", default: false })
  isUsed: boolean;

  @Column({ name: "used_at", type: "timestamp", nullable: true })
  usedAt: Date | null;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}
