import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { IClassStudent } from "../../domain/types";

@Entity({ name: "class_students" })
@Index(["classId", "email"], { unique: true })
export class ClassStudentModel implements IClassStudent {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "class_id", type: "uuid" })
  classId: string;

  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}

