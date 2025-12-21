import { Entity, Column, PrimaryColumn, Index } from "typeorm";

@Entity("refresh_tokens")
export class RefreshTokenModel {
  @PrimaryColumn("varchar", { length: 255 })
  id: string;

  @Column("varchar", { length: 64 })
  @Index("idx_refresh_token_hash")
  tokenHash: string;

  @Column("varchar", { length: 255 })
  @Index("idx_refresh_token_user_id")
  userId: string;

  @Column("text", { nullable: true })
  deviceInfo?: string;

  @Column("varchar", { length: 50, nullable: true })
  ipAddress?: string;

  @Column("boolean", { default: false })
  @Index("idx_refresh_token_revoked")
  isRevoked: boolean;

  @Column("timestamp")
  @Index("idx_refresh_token_expires_at")
  expiresAt: Date;

  @Column("timestamp", { nullable: true })
  revokedAt?: Date;

  @Column("timestamp", { nullable: true })
  lastUsedAt?: Date;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}
