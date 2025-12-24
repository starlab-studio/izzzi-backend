import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { IFaqCategory } from "../../domain/types";

@Entity({ name: "faq_categories" })
export class FaqCategoryModel implements IFaqCategory {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ name: "label_category", type: "varchar", length: 255 })
  labelCategory: string;

  @Column({ name: "order_index", type: "integer", default: 0 })
  orderIndex: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;

  @Column({ name: "faq_tab_id", type: "integer" })
  faqTabId: number;
}
