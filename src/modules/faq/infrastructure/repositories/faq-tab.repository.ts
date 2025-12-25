import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { IFaqTab } from "../../domain/types";
import { FaqTabEntity } from "../../domain/entities/faq-tab.entity";
import { FaqTabModel } from "../models/faq-tab.model";
import { IFaqTabRepository } from "../../domain/repositories/faq-tab.repository";

export class FaqTabRepository implements IFaqTabRepository {
  constructor(
    @InjectRepository(FaqTabModel)
    private ormRepository: Repository<IFaqTab>,
  ) {}

  async findAll(): Promise<FaqTabEntity[]> {
    const ormEntities = await this.ormRepository.find({
      order: { orderIndex: "ASC" },
    });
    return ormEntities.map((ormEntity) => FaqTabEntity.reconstitute(ormEntity));
  }

  async findAllActive(): Promise<FaqTabEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { isActive: true },
      order: { orderIndex: "ASC" },
    });
    return ormEntities.map((ormEntity) => FaqTabEntity.reconstitute(ormEntity));
  }

  async findById(id: string): Promise<FaqTabEntity | null> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) return null;
    const ormEntity = await this.ormRepository.findOne({ where: { id: parsedId } });
    if (!ormEntity) return null;
    return FaqTabEntity.reconstitute(ormEntity);
  }

  async create(entity: FaqTabEntity): Promise<FaqTabEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.ormRepository.create(data);
    const saved = await this.ormRepository.save(ormEntity);
    return FaqTabEntity.reconstitute(saved);
  }

  async save(entity: FaqTabEntity): Promise<FaqTabEntity> {
    const data = entity.toPersistence();
    const saved = await this.ormRepository.save(data);
    return FaqTabEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) return;
    await this.ormRepository.delete(parsedId);
  }
}
