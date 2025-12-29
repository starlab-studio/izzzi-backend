import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { IFaqItem } from "../../domain/types";
import { FaqItemEntity } from "../../domain/entities/faq-item.entity";
import { FaqItemModel } from "../models/faq-item.model";
import { IFaqItemRepository } from "../../domain/repositories/faq-item.repository";

export class FaqItemRepository implements IFaqItemRepository {
  constructor(
    @InjectRepository(FaqItemModel)
    private ormRepository: Repository<IFaqItem>
  ) {}

  async findAll(): Promise<FaqItemEntity[]> {
    const ormEntities = await this.ormRepository.find({
      order: { orderIndex: "ASC" },
    });
    return ormEntities.map((ormEntity) =>
      FaqItemEntity.reconstitute(ormEntity)
    );
  }

  async findAllActive(): Promise<FaqItemEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { isActive: true },
      order: { orderIndex: "ASC" },
    });
    return ormEntities.map((ormEntity) =>
      FaqItemEntity.reconstitute(ormEntity)
    );
  }

  async findByCategoryId(categoryId: number): Promise<FaqItemEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { faqCategoryId: categoryId },
      order: { orderIndex: "ASC" },
    });
    return ormEntities.map((ormEntity) =>
      FaqItemEntity.reconstitute(ormEntity)
    );
  }

  async findFeatured(): Promise<FaqItemEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { isFeatured: true, isActive: true },
      order: { orderIndex: "ASC" },
    });
    return ormEntities.map((ormEntity) =>
      FaqItemEntity.reconstitute(ormEntity)
    );
  }

  async findById(id: string): Promise<FaqItemEntity | null> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) return null;
    const ormEntity = await this.ormRepository.findOne({ where: { id: parsedId } });
    if (!ormEntity) return null;
    return FaqItemEntity.reconstitute(ormEntity);
  }

  async create(entity: FaqItemEntity): Promise<FaqItemEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.ormRepository.create(data);
    const saved = await this.ormRepository.save(ormEntity);
    return FaqItemEntity.reconstitute(saved);
  }

  async save(entity: FaqItemEntity): Promise<FaqItemEntity> {
    const data = entity.toPersistence();
    const saved = await this.ormRepository.save(data);
    return FaqItemEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) return;
    await this.ormRepository.delete(parsedId);
  }
}