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

  async findTrialsEndingIn(days: number): Promise<SubscriptionEntity[]> {
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);

    // Set time to start of day for comparison
    const startOfTargetDay = new Date(targetDate);
    startOfTargetDay.setHours(0, 0, 0, 0);

    const endOfTargetDay = new Date(targetDate);
    endOfTargetDay.setHours(23, 59, 59, 999);

    const ormEntities = await this.ormRepository
      .createQueryBuilder("subscription")
      .where("subscription.status = :status", { status: "trial" })
      .andWhere("subscription.trial_end_date >= :startDate", {
        startDate: startOfTargetDay,
      })
      .andWhere("subscription.trial_end_date <= :endDate", {
        endDate: endOfTargetDay,
      })
      .orderBy("subscription.trial_end_date", "ASC")
      .getMany();

    return ormEntities.map((ormEntity) =>
      SubscriptionEntity.reconstitute(ormEntity)
    );
  }

  async findExpiredWithStripeId(
    beforeDate: Date
  ): Promise<SubscriptionEntity[]> {
    const ormEntities = await this.ormRepository
      .createQueryBuilder("subscription")
      .where("subscription.current_period_end <= :beforeDate", { beforeDate })
      .andWhere("subscription.stripe_subscription_id IS NOT NULL")
      .andWhere("subscription.status IN (:...statuses)", {
        statuses: ["active", "past_due", "trial", "cancelled"],
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
