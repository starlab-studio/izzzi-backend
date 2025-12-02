import { Entity, Column, Index, PrimaryColumn } from "typeorm";
import { AuthIdentityName, IAuthIdentity } from "../../domain/types";

@Entity({ name: "auth_identities" })
@Index(["provider", "username"], { unique: true })
export class AuthIdentityModel implements IAuthIdentity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 45 })
  provider: AuthIdentityName;

  @Column({ name: "provider_user_id", type: "varchar", length: 65 })
  providerUserId: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId: string;

  @Column({ name: "failed_login_attempts", type: "int", default: 0 })
  failedLoginAttempts: number;

  @Column({ name: "last_failed_login_at", type: "timestamp", nullable: true })
  lastFailedLoginAt: Date | null;

  @Column({ name: "locked_until", type: "timestamp", nullable: true })
  lockedUntil: Date | null;

  @Column({ name: "is_locked", type: "boolean", default: false })
  isLocked: boolean;

  @Column({ name: "is_email_verified", type: "boolean", default: false })
  isEmailVerified: boolean;

  @Column({ name: "email_verified_at", type: "timestamp", nullable: true })
  emailVerifiedAt: Date | null;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}
