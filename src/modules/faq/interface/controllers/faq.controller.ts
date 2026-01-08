import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { BaseController } from "src/core";
import { FaqFacade } from "../../application/facades/faq.facade";
import {
  FaqTabResponseDto,
  FaqItemResponseDto,
  FaqCategoryWithItemsDto,
} from "../dto/faq.dto";

@ApiTags("faq")
@Controller("v1/faq")
export class FaqController extends BaseController {
  constructor(private readonly faqFacade: FaqFacade) {
    super();
  }

  @Get("tabs")
  @ApiOperation({ summary: "Récupérer tous les onglets FAQ actifs" })
  @ApiResponse({
    status: 200,
    description: "Liste des onglets FAQ",
    type: [FaqTabResponseDto],
  })
  async getFaqTabs() {
    const result = await this.faqFacade.getAllFaq();
    return this.success(result);
  }

  @Get("featured-items")
  @ApiOperation({ summary: "Récupérer les items FAQ mis en avant" })
  @ApiResponse({
    status: 200,
    description: "Liste des items FAQ mis en avant",
    type: [FaqItemResponseDto],
  })
  async getFeaturedItems() {
    const result = await this.faqFacade.getFeaturedItems();
    return this.success(result);
  }

  @Get("tab/:tabId")
  @ApiOperation({
    summary: "Récupérer le contenu (catégories et items) d'un onglet",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des catégories avec leurs items pour l'onglet donné",
    type: [FaqCategoryWithItemsDto],
  })
  async getFaqContentByTab(@Param("tabId") tabId: string) {
    const id = parseInt(tabId, 10);
    // You might want to handle NaN or validation via ParseIntPipe
    const result = await this.faqFacade.getFaqContentByTab(id);
    return this.success(result);
  }
}
