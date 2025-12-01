import { Entity, Column } from "typeorm";
import { BaseModel } from "src/core";
import { ISubject } from "../../domain/types";

@Entity({ name: "subjects" })
export class SubjectModel extends BaseModel implements ISubject {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 7 })
  color: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;
}
