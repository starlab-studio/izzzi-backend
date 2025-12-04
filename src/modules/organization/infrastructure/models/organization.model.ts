import { Entity, Column } from "typeorm";

import { BaseModel } from "src/core";
import { IOrganization } from "../../domain/types";

@Entity({ name: "organizations" })
export class OrganizationModel extends BaseModel implements IOrganization {
  @Column({ type: "varchar", length: 255, unique: true })
  name: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  siren?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  siret?: string;

  @Column({ name: "vat_number", type: "varchar", length: 20, nullable: true })
  vatNumber?: string;

  @Column({ type: "varchar", unique: true })
  slug: string;

  @Column({ name: "owner_id", type: "uuid" })
  ownerId: string;
}
