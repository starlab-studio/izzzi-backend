import { Entity, Column, PrimaryColumn } from "typeorm";
import { ISubjectAssignment } from "../../domain/types";

@Entity({ name: "subject_assignments" })
export class SubjectAssignmentModel implements ISubjectAssignment {
  @PrimaryColumn("uuid", { name: "subject_id" })
  subjectId: string;

  @PrimaryColumn("uuid", { name: "class_id" })
  classId: string;

  @Column({ name: "order_index", type: "int", default: 1 })
  orderIndex: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;
}
