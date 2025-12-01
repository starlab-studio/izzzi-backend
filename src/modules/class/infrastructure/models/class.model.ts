import { Entity, Column } from "typeorm";
import { BaseModel } from "src/core";
import { IClass } from "../../domain/types";

@Entity({ name: "class" })
export class ClassModel extends BaseModel implements IClass {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 100, unique: true })
  code: string;

  @Column({ type: "text", nullable: true })
  description?: string;

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

}
