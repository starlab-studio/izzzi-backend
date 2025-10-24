import { Entity, Column } from "typeorm";

import { BaseModel } from "src/core";
import { IMembership, Role } from "../../domain/types";

@Entity({ name: "memberships" })
export class MembershipModel extends BaseModel implements IMembership {
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ type: "varchar", length: 45 })
  role: Role;

  @Column({ name: "added_by", type: "uuid", nullable: true })
  addedBy: string | null;
}
