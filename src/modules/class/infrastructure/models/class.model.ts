import { Entity, Column, PrimaryColumn } from "typeorm";
import { IClass } from "../../domain/types";

@Entity({ name: "classes" })
export class ClassModel implements IClass {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 100, unique: true })
  code: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ name: "number_of_students", type: "integer" })
  numberOfStudents: number;

  @Column({ name: "student_emails", type: "jsonb", default: () => "'[]'::jsonb" })
  studentEmails: string[];

  @Column({ name: "access_token", type: "varchar", length: 255 })
  accessToken: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  createdAt: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt: Date | null;
}
