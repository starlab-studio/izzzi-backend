import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { IUserSubscription } from "../../domain/types";
import { SubscriptionEntity } from "../../domain/entities/subscription.entity";
import { UserSubscriptionModel } from "../models/user-subscription.model";
import { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @InjectRepository(UserSubscriptionModel)
    private ormRepository: Repository<IUserSubscription>
  ) {}

  async findById(id: string): Promise<SubscriptionEntity | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return SubscriptionEntity.reconstitute(ormEntity);
  }

  async findAll(): Promise<SubscriptionEntity[]> {
    const ormEntities = await this.ormRepository.find({
      order: { createdAt: "DESC" },
    });
    return ormEntities.map((ormEntity) =>
      SubscriptionEntity.reconstitute(ormEntity)
    );
  }

  async findByUserId(userId: string): Promise<SubscriptionEntity | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    if (!ormEntity) return null;
    return SubscriptionEntity.reconstitute(ormEntity);
  }

  async findByOrganizationId(
    organizationId: string
  ): Promise<SubscriptionEntity | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { organizationId },
      order: { createdAt: "DESC" },
    });
    if (!ormEntity) return null;
    return SubscriptionEntity.reconstitute(ormEntity);
  }

  async findByStripeSubscriptionId(
    stripeSubId: string
  ): Promise<SubscriptionEntity | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { stripeSubscriptionId: stripeSubId },
    });
    if (!ormEntity) return null;
    return SubscriptionEntity.reconstitute(ormEntity);
  }

  async findActiveByOrganizationId(
    organizationId: string
  ): Promise<SubscriptionEntity | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: [
        { organizationId, status: "active" as const },
        { organizationId, status: "trial" as const },
      ],
      order: { createdAt: "DESC" },
    });
    if (!ormEntity) return null;
    return SubscriptionEntity.reconstitute(ormEntity);
  }

  async findAllActive(): Promise<SubscriptionEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: [{ status: "active" as const }, { status: "trial" as const }],
      order: { createdAt: "DESC" },
    });
    return ormEntities.map((ormEntity) =>
      SubscriptionEntity.reconstitute(ormEntity)
    );
  }

  async findExpiring(beforeDate: Date): Promise<SubscriptionEntity[]> {
    const ormEntities = await this.ormRepository
      .createQueryBuilder("subscription")
      .where("subscription.current_period_end <= :beforeDate", { beforeDate })
      .andWhere("subscription.status IN (:...statuses)", {
        statuses: ["active", "trial"],
      })
      .orderBy("subscription.current_period_end", "ASC")
      .getMany();

    return ormEntities.map((ormEntity) =>
      SubscriptionEntity.reconstitute(ormEntity)
    );
  }

  async save(entity: SubscriptionEntity): Promise<SubscriptionEntity> {
    const data = entity.toPersistence();
    const saved = await this.ormRepository.save(data);
    return SubscriptionEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }
}
