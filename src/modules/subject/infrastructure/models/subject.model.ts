import { Entity, Column, PrimaryColumn } from "typeorm";
import { ISubject } from "../../domain/types";

@Entity({ name: "subjects" })
export class SubjectModel implements ISubject {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "varchar", length: 7 })
  color: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ name: "created_by", type: "uuid" })
  createdBy: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  createdAt: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt: Date | null;
}
