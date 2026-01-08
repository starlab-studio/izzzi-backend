import { IRepository } from "src/core";
import { FaqCategoryEntity } from "../entities/faq-category.entity";

export interface IFaqCategoryRepository extends IRepository<FaqCategoryEntity> {
  findByTabId(tabId: number): Promise<FaqCategoryEntity[]>;
  findAllActive(): Promise<FaqCategoryEntity[]>;
}
