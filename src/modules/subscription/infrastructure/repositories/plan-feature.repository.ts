import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { IPlanFeature } from "../../domain/types";
import { PlanFeatureEntity } from "../../domain/entities/plan-feature.entity";
import { PlanFeatureModel } from "../models/plan-feature.model";
import { IPlanFeatureRepository } from "../../domain/repositories/plan-feature.repository";

export class PlanFeatureRepository implements IPlanFeatureRepository {
  constructor(
    @InjectRepository(PlanFeatureModel)
    private ormRepository: Repository<IPlanFeature>
  ) {}

  async findByPlanId(planId: string): Promise<PlanFeatureEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { planId },
      order: { displayOrder: "ASC" },
    });
    return ormEntities.map((ormEntity) =>
      PlanFeatureEntity.reconstitute(ormEntity)
    );
  }

  async findAll(): Promise<PlanFeatureEntity[]> {
    const ormEntities = await this.ormRepository.find({
      order: { displayOrder: "ASC" },
    });
    return ormEntities.map((ormEntity) =>
      PlanFeatureEntity.reconstitute(ormEntity)
    );
  }

  async findById(id: string): Promise<PlanFeatureEntity | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return PlanFeatureEntity.reconstitute(ormEntity);
  }

  async create(entity: PlanFeatureEntity): Promise<PlanFeatureEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.ormRepository.create(data);
    const saved = await this.ormRepository.save(ormEntity);
    return PlanFeatureEntity.reconstitute(saved);
  }

  async save(entity: PlanFeatureEntity): Promise<PlanFeatureEntity> {
    const data = entity.toPersistence();
    const saved = await this.ormRepository.save(data);
    return PlanFeatureEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }
}
