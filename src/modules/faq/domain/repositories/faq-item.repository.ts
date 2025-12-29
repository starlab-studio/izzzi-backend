import { IRepository } from "src/core";
import { FaqItemEntity } from "../entities/faq-item.entity";

export interface IFaqItemRepository extends IRepository<FaqItemEntity> {
  findByCategoryId(categoryId: number): Promise<FaqItemEntity[]>;
  findAllActive(): Promise<FaqItemEntity[]>;
  findFeatured(): Promise<FaqItemEntity[]>;
}
