import { IRepository } from "src/core";
import { FaqTabEntity } from "../entities/faq-tab.entity";

export interface IFaqTabRepository extends IRepository<FaqTabEntity> {
  findAllActive(): Promise<FaqTabEntity[]>;
  findById(id: string): Promise<FaqTabEntity | null>;
}
