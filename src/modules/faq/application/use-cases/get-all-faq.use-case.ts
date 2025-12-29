import { Inject, Injectable } from "@nestjs/common";
import type { IFaqTabRepository } from "../../domain/repositories/faq-tab.repository";
import type { IFaqTab } from "../../domain/types";

@Injectable()
export class GetAllFaqUseCase {
  constructor(
    @Inject("IFaqTabRepository")
    private readonly faqTabRepository: IFaqTabRepository,
  ) {}

  async execute(): Promise<IFaqTab[]> {
    return this.faqTabRepository.findAllActive();
  }
}
