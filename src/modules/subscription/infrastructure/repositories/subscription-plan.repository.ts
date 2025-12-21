import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ISubscriptionPlan } from "../../domain/types";
import { SubscriptionPlanEntity } from "../../domain/entities/subscription-plan.entity";
import { SubscriptionPlanModel } from "../models/subscription-plan.model";
import { ISubscriptionPlanRepository } from "../../domain/repositories/subscription-plan.repository";

export class SubscriptionPlanRepository implements ISubscriptionPlanRepository {
  constructor(
    @InjectRepository(SubscriptionPlanModel)
    private ormRepository: Repository<ISubscriptionPlan>
  ) {}

  async findAll(): Promise<SubscriptionPlanEntity[]> {
    const ormEntities = await this.ormRepository.find({
      order: { displayOrder: "ASC" },
    });
    return ormEntities.map((ormEntity) =>
      SubscriptionPlanEntity.reconstitute(ormEntity)
    );
  }

  async findAllActive(): Promise<SubscriptionPlanEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { isActive: true },
      order: { displayOrder: "ASC" },
    });
    return ormEntities.map((ormEntity) =>
      SubscriptionPlanEntity.reconstitute(ormEntity)
    );
  }

  async findById(id: string): Promise<SubscriptionPlanEntity | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return SubscriptionPlanEntity.reconstitute(ormEntity);
  }

  async findByName(name: string): Promise<SubscriptionPlanEntity | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { name } });
    if (!ormEntity) return null;
    return SubscriptionPlanEntity.reconstitute(ormEntity);
  }

  async create(entity: SubscriptionPlanEntity): Promise<SubscriptionPlanEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.ormRepository.create(data);
    const saved = await this.ormRepository.save(ormEntity);
    return SubscriptionPlanEntity.reconstitute(saved);
  }

  async save(entity: SubscriptionPlanEntity): Promise<SubscriptionPlanEntity> {
    const data = entity.toPersistence();
    const saved = await this.ormRepository.save(data);
    return SubscriptionPlanEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }
}
