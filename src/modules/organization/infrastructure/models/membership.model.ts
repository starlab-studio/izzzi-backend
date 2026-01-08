import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";

import { UserRole } from "src/core";
import { IMembership, MembershipStatus } from "../../domain/types";
import { UserModel } from "./user.model";
import { OrganizationModel } from "./organization.model";

@Entity({ name: "memberships" })
export class MembershipModel implements IMembership {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ type: "varchar", length: 45 })
  role: UserRole;

  @Column({ name: "added_by", type: "uuid", nullable: true })
  addedBy: string | null;

  @Column({ type: "varchar", length: 45 })
  status: MembershipStatus;

  @Column({ name: "left_at", type: "timestamp", nullable: true })
  leftAt: Date | null;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;

  @ManyToOne(() => UserModel, (user) => user.memberships)
  @JoinColumn({ name: "user_id" })
  user: UserModel;

  @ManyToOne(() => OrganizationModel, (org) => org.memberships)
  @JoinColumn({ name: "organization_id" })
  organization: OrganizationModel;
}
