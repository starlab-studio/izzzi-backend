import { Entity, Column, PrimaryColumn, Index } from "typeorm";

@Entity("password_reset_tokens")
export class PasswordResetTokenModel {
  @PrimaryColumn("varchar", { length: 255 })
  id: string;

  @Column("varchar", { length: 255 })
  @Index("idx_password_reset_token_user_id")
  userId: string;

  @Column("varchar", { length: 64 })
  @Index("idx_password_reset_token_hash")
  tokenHash: string;

  @Column("varchar", { length: 255 })
  @Index("idx_password_reset_token_email")
  email: string;

  @Column("timestamp")
  @Index("idx_password_reset_token_expires_at")
  expiresAt: Date;

  @Column("boolean", { default: false })
  @Index("idx_password_reset_token_is_used")
  isUsed: boolean;

  @Column("timestamp", { nullable: true })
  usedAt?: Date;

  @Column("varchar", { length: 50, nullable: true })
  ipAddress?: string;

  @Column("text", { nullable: true })
  userAgent?: string;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}
