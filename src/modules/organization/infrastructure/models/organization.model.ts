import { Entity, Column, PrimaryColumn, OneToMany } from "typeorm";

import { IOrganization } from "../../domain/types";
import { MembershipModel } from "./membership.model";

@Entity({ name: "organizations" })
export class OrganizationModel implements IOrganization {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, unique: true })
  name: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  siren: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  siret: string | null;

  @Column({ name: "vat_number", type: "varchar", length: 20, nullable: true })
  vatNumber: string | null;

  @Column({ type: "varchar", unique: true })
  slug: string;

  @Column({ name: "owner_id", type: "uuid" })
  ownerId: string;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;

  @OneToMany(() => MembershipModel, (membership) => membership.organization, {
    cascade: false,
  })
  memberships: MembershipModel[];
}
