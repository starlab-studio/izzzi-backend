import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { IFaqTab } from "../../domain/types";

@Entity({ name: "faq_tabs" })
export class FaqTabModel implements IFaqTab {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ name: "label_tab", type: "varchar", length: 255 })
  labelTab: string;

  @Column({ name: "order_index", type: "integer", default: 0 })
  orderIndex: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
}
