import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FaqTabModel } from "./infrastructure/models/faq-tab.model";
import { FaqCategoryModel } from "./infrastructure/models/faq-category.model";
import { FaqItemModel } from "./infrastructure/models/faq-item.model";

import { FaqTabRepository } from "./infrastructure/repositories/faq-tab.repository";
import { FaqCategoryRepository } from "./infrastructure/repositories/faq-category.repository";
import { FaqItemRepository } from "./infrastructure/repositories/faq-item.repository";

import { IFaqTabRepository } from "./domain/repositories/faq-tab.repository";
import { IFaqCategoryRepository } from "./domain/repositories/faq-category.repository";
import { IFaqItemRepository } from "./domain/repositories/faq-item.repository";

import { GetAllFaqUseCase } from "./application/use-cases/get-all-faq.use-case";
import { GetFeaturedItemsUseCase } from "./application/use-cases/get-featured-items.use-case";
import { GetFaqContentByTabUseCase } from "./application/use-cases/get-faq-content-by-tab.use-case";

import { FaqFacade } from "./application/facades/faq.facade";

import { FaqController } from "./interface/controllers/faq.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([FaqTabModel, FaqCategoryModel, FaqItemModel]),
  ],
  controllers: [FaqController],
  providers: [
    // Repositories
    {
      provide: "IFaqTabRepository",
      useClass: FaqTabRepository,
    },
    {
      provide: "IFaqCategoryRepository",
      useClass: FaqCategoryRepository,
    },
    {
      provide: "IFaqItemRepository",
      useClass: FaqItemRepository,
    },
    // Use Cases
    {
      provide: GetAllFaqUseCase,
      useFactory: (faqTabRepository: IFaqTabRepository) =>
        new GetAllFaqUseCase(faqTabRepository),
      inject: ["IFaqTabRepository"],
    },
    {
      provide: GetFeaturedItemsUseCase,
      useFactory: (faqItemRepository: IFaqItemRepository) =>
        new GetFeaturedItemsUseCase(faqItemRepository),
      inject: ["IFaqItemRepository"],
    },
    {
      provide: GetFaqContentByTabUseCase,
      useFactory: (
        faqCategoryRepository: IFaqCategoryRepository,
        faqItemRepository: IFaqItemRepository,
      ) =>
        new GetFaqContentByTabUseCase(faqCategoryRepository, faqItemRepository),
      inject: ["IFaqCategoryRepository", "IFaqItemRepository"],
    },

    // Facade
    {
      provide: FaqFacade,
      useFactory: (
        getAllFaqUseCase: GetAllFaqUseCase,
        getFeaturedItemsUseCase: GetFeaturedItemsUseCase,
        getFaqContentByTabUseCase: GetFaqContentByTabUseCase,
      ) =>
        new FaqFacade(
          getAllFaqUseCase,
          getFeaturedItemsUseCase,
          getFaqContentByTabUseCase,
        ),
      inject: [
        GetAllFaqUseCase,
        GetFeaturedItemsUseCase,
        GetFaqContentByTabUseCase,
      ],
    },
  ],
  exports: [FaqFacade],
})
export class FaqModule {}
