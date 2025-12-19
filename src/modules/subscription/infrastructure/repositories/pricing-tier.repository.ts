import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { IPricingTier } from "../../domain/types";
import { PricingTierEntity } from "../../domain/entities/pricing-tier.entity";
import { PricingTierModel } from "../models/pricing-tier.model";
import { IPricingTierRepository } from "../../domain/repositories/pricing-tier.repository";

export class PricingTierRepository implements IPricingTierRepository {
  constructor(
    @InjectRepository(PricingTierModel)
    private ormRepository: Repository<IPricingTier>
  ) {}

  async findByPlanId(planId: string): Promise<PricingTierEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { planId },
      order: { minClasses: "ASC" },
    });
    return ormEntities.map((ormEntity) =>
      PricingTierEntity.reconstitute(ormEntity)
    );
  }

  async findByPlanIdAndBillingPeriod(
    planId: string,
    billingPeriod: "monthly" | "annual"
  ): Promise<PricingTierEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { planId, billingPeriod },
      order: { minClasses: "ASC" },
    });
    return ormEntities.map((ormEntity) =>
      PricingTierEntity.reconstitute(ormEntity)
    );
  }

  async findAll(): Promise<PricingTierEntity[]> {
    const ormEntities = await this.ormRepository.find({
      order: { minClasses: "ASC" },
    });
    return ormEntities.map((ormEntity) =>
      PricingTierEntity.reconstitute(ormEntity)
    );
  }

  async findById(id: string): Promise<PricingTierEntity | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return PricingTierEntity.reconstitute(ormEntity);
  }

  async create(entity: PricingTierEntity): Promise<PricingTierEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.ormRepository.create(data);
    const saved = await this.ormRepository.save(ormEntity);
    return PricingTierEntity.reconstitute(saved);
  }

  async save(entity: PricingTierEntity): Promise<PricingTierEntity> {
    const data = entity.toPersistence();
    const saved = await this.ormRepository.save(data);
    return PricingTierEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }
}
