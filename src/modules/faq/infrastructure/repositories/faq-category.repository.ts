import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { IFaqCategory } from "../../domain/types";
import { FaqCategoryEntity } from "../../domain/entities/faq-category.entity";
import { FaqCategoryModel } from "../models/faq-category.model";
import { IFaqCategoryRepository } from "../../domain/repositories/faq-category.repository";

export class FaqCategoryRepository implements IFaqCategoryRepository {
  constructor(
    @InjectRepository(FaqCategoryModel)
    private ormRepository: Repository<IFaqCategory>,
  ) {}

  async findAll(): Promise<FaqCategoryEntity[]> {
    const ormEntities = await this.ormRepository.find({
      order: { orderIndex: "ASC" },
    });
    return ormEntities.map((ormEntity) =>
      FaqCategoryEntity.reconstitute(ormEntity),
    );
  }

  async findAllActive(): Promise<FaqCategoryEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { isActive: true },
      order: { orderIndex: "ASC" },
    });
    return ormEntities.map((ormEntity) =>
      FaqCategoryEntity.reconstitute(ormEntity),
    );
  }

  async findByTabId(tabId: number): Promise<FaqCategoryEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { faqTabId: tabId },
      order: { orderIndex: "ASC" },
    });
    return ormEntities.map((ormEntity) =>
      FaqCategoryEntity.reconstitute(ormEntity),
    );
  }

  async findById(id: string): Promise<FaqCategoryEntity | null> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) return null;
    const ormEntity = await this.ormRepository.findOne({
      where: { id: parsedId },
    });
    if (!ormEntity) return null;
    return FaqCategoryEntity.reconstitute(ormEntity);
  }

  async create(entity: FaqCategoryEntity): Promise<FaqCategoryEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.ormRepository.create(data);
    const saved = await this.ormRepository.save(ormEntity);
    return FaqCategoryEntity.reconstitute(saved);
  }

  async save(entity: FaqCategoryEntity): Promise<FaqCategoryEntity> {
    const data = entity.toPersistence();
    const saved = await this.ormRepository.save(data);
    return FaqCategoryEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) return;
    await this.ormRepository.delete(parsedId);
  }
}
