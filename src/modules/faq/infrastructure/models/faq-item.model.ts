import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { IFaqItem } from "../../domain/types";

@Entity({ name: "faq_items" })
export class FaqItemModel implements IFaqItem {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "text" })
  question: string;

  @Column({ name: "answer_paragraph", type: "text" })
  answerParagraph: string;

  @Column({ name: "answer_list", type: "text", nullable: true })
  answerList: string | null;

  @Column({ type: "integer", default: 0 })
  views: number;

  @Column({ name: "is_featured", type: "boolean", default: false })
  isFeatured: boolean;

  @Column({ name: "order_index", type: "integer", default: 0 })
  orderIndex: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;

  @Column({ name: "faq_category_id", type: "integer" })
  faqCategoryId: number;
}
