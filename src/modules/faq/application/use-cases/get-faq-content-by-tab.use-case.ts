import { Inject, Injectable } from "@nestjs/common";
import type { IFaqCategoryRepository } from "../../domain/repositories/faq-category.repository";
import type { IFaqItemRepository } from "../../domain/repositories/faq-item.repository";
import type { IFaqCategoryWithItems } from "../../domain/types";

@Injectable()
export class GetFaqContentByTabUseCase {
  constructor(
    @Inject("IFaqCategoryRepository")
    private readonly faqCategoryRepository: IFaqCategoryRepository,
    @Inject("IFaqItemRepository")
    private readonly faqItemRepository: IFaqItemRepository,
  ) {}

  async execute(tabId: number): Promise<IFaqCategoryWithItems[]> {
    const categories = await this.faqCategoryRepository.findByTabId(tabId);
    
    const categoriesWithItems = await Promise.all(
      categories.map(async (category) => {
        const items = await this.faqItemRepository.findByCategoryId(category.id!);
        const activeItems = items.filter(item => item.isActive);
        
        return {
          ...category.toPersistence(),
          items: activeItems.map(item => item.toPersistence()),
        };
      })
    );

    return categoriesWithItems.filter(c => c.isActive);
  }
}
