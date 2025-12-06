import { Entity, Column, PrimaryColumn } from "typeorm";

import { UserRole } from "src/core";
import { IInvitation, InvitationStatus } from "../../domain/types";

@Entity({ name: "invitations" })
export class InvitationModel implements IInvitation {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ name: "invited_by", type: "uuid" })
  invitedBy: string;

  @Column({ type: "varchar", length: 65 })
  status: InvitationStatus;

  @Column({ type: "varchar", length: 65 })
  role: UserRole;

  @Column({ type: "varchar", length: 255 })
  token: string;

  @Column({ name: "expires_at", type: "timestamp" })
  expiresAt: Date;

  @Column({ name: "accepted_at", type: "timestamp" })
  acceptedAt: Date | null;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}
