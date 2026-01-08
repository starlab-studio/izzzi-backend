import { Entity, Column } from "typeorm";

import { BaseModel } from "src/core";
import {
  INotification,
  NotificationMode,
  NotificationStatus,
} from "../../domain/notification.types";

@Entity({ name: "notifications" })
export class NotificationModel extends BaseModel implements INotification {
  @Column({ type: "varchar", length: 65 })
  sender!: string;

  @Column({ type: "varchar", length: 65 })
  mode!: NotificationMode;

  @Column({ type: "varchar", length: 65, nullable: true })
  name?: string;

  @Column({ type: "varchar", length: 65 })
  target!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  subject?: string;

  @Column({ type: "text", nullable: true })
  template?: string;

  @Column({ type: "varchar", length: 1000, nullable: true })
  message?: string;

  @Column({ type: "varchar", length: 65, default: NotificationStatus.PENDING })
  status!: NotificationStatus;

  @Column({ type: "int" })
  retryCount!: number;

  @Column({ name: "delivered_at", type: "timestamp", nullable: true })
  deliveredAt?: Date;

  @Column({ name: "is_read", type: "boolean", default: false })
  isRead!: boolean;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;
}
