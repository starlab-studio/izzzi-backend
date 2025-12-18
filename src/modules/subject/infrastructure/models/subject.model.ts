import { Entity, Column, PrimaryColumn } from "typeorm";
import { ISubject } from "../../domain/types";

@Entity({ name: "subjects" })
export class SubjectModel implements ISubject {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "instructor_name", type: "varchar", length: 255, nullable: true })
  instructorName: string | null;

  @Column({ name: "instructor_email", type: "varchar", length: 255, nullable: true })
  instructorEmail: string | null;

  @Column({ name: "first_course_date", type: "date", nullable: true })
  firstCourseDate: Date | null;

  @Column({ name: "last_course_date", type: "date", nullable: true })
  lastCourseDate: Date | null;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ name: "created_by", type: "uuid" })
  createdBy: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  createdAt: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt: Date | null;
}
