import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ContactRequestStatus } from "../../domain/types";

@Entity("contact_requests")
export class ContactRequestModel {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "first_name", type: "varchar", length: 100 })
  firstName: string;

  @Column({ name: "last_name", type: "varchar", length: 100 })
  lastName: string;

  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  phone: string | null;

  @Column({ name: "organization_name", type: "varchar", length: 255, nullable: true })
  organizationName: string | null;

  @Column({ name: "number_of_classes", type: "int", nullable: true })
  numberOfClasses: number | null;

  @Column({ type: "text" })
  message: string;

  @Column({
    type: "enum",
    enum: ContactRequestStatus,
    default: ContactRequestStatus.PENDING,
  })
  status: ContactRequestStatus;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ name: "processed_by", type: "uuid", nullable: true })
  processedBy: string | null;

  @Column({ name: "processed_at", type: "timestamp", nullable: true })
  processedAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

