// Replacement content for FaqFacade
import { Injectable } from "@nestjs/common";
import { GetAllFaqUseCase } from "../use-cases/get-all-faq.use-case";
import { GetFeaturedItemsUseCase } from "../use-cases/get-featured-items.use-case";
import { GetFaqContentByTabUseCase } from "../use-cases/get-faq-content-by-tab.use-case";
import { IFaqTab, IFaqItem, IFaqCategoryWithItems } from "../../domain/types";

@Injectable()
export class FaqFacade {
  constructor(
    private readonly getAllFaqUseCase: GetAllFaqUseCase,
    private readonly getFeaturedItemsUseCase: GetFeaturedItemsUseCase,
    private readonly getFaqContentByTabUseCase: GetFaqContentByTabUseCase,
  ) {}

  async getAllFaq(): Promise<IFaqTab[]> {
    return await this.getAllFaqUseCase.execute();
  }

  async getFeaturedItems(): Promise<IFaqItem[]> {
    return await this.getFeaturedItemsUseCase.execute();
  }

  async getFaqContentByTab(tabId: number): Promise<IFaqCategoryWithItems[]> {
    return await this.getFaqContentByTabUseCase.execute(tabId);
  }
}
