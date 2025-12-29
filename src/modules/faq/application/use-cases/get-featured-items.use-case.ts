import { Inject, Injectable } from "@nestjs/common";
import type { IFaqItemRepository } from "../../domain/repositories/faq-item.repository";
import type { IFaqItem } from "../../domain/types";

@Injectable()
export class GetFeaturedItemsUseCase {
  constructor(
    @Inject("IFaqItemRepository")
    private readonly faqItemRepository: IFaqItemRepository,
  ) {}

  async execute(): Promise<IFaqItem[]> {
    return this.faqItemRepository.findFeatured();
  }
}
