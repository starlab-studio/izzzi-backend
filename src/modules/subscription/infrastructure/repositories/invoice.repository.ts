import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { IInvoice } from "../../domain/types";
import { InvoiceEntity } from "../../domain/entities/invoice.entity";
import { InvoiceModel } from "../models/invoice.model";
import { IInvoiceRepository } from "../../domain/repositories/invoice.repository";

export class InvoiceRepository implements IInvoiceRepository {
  constructor(
    @InjectRepository(InvoiceModel)
    private ormRepository: Repository<IInvoice>,
  ) {}

  async findById(id: string): Promise<InvoiceEntity | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return InvoiceEntity.reconstitute(ormEntity);
  }

  async findAll(): Promise<InvoiceEntity[]> {
    const ormEntities = await this.ormRepository.find({
      order: { createdAt: "DESC" },
    });
    return ormEntities.map((ormEntity) =>
      InvoiceEntity.reconstitute(ormEntity),
    );
  }

  async findByStripeInvoiceId(
    stripeInvoiceId: string,
  ): Promise<InvoiceEntity | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { stripeInvoiceId },
    });
    if (!ormEntity) return null;
    return InvoiceEntity.reconstitute(ormEntity);
  }

  async findBySubscriptionId(subscriptionId: string): Promise<InvoiceEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { subscriptionId },
      order: { createdAt: "DESC" },
    });
    return ormEntities.map((ormEntity) =>
      InvoiceEntity.reconstitute(ormEntity),
    );
  }

  async findLatestByOrganizationId(
    organizationId: string,
  ): Promise<InvoiceEntity | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { organizationId },
      order: { createdAt: "DESC" },
    });
    if (!ormEntity) return null;
    return InvoiceEntity.reconstitute(ormEntity);
  }

  async findLatestPaidByOrganizationId(
    organizationId: string,
    since?: Date,
  ): Promise<InvoiceEntity | null> {
    const queryBuilder = this.ormRepository
      .createQueryBuilder("invoice")
      .where("invoice.organizationId = :organizationId", { organizationId })
      .andWhere("invoice.status = :status", { status: "paid" })
      .orderBy("invoice.paidAt", "DESC")
      .addOrderBy("invoice.createdAt", "DESC");

    if (since) {
      queryBuilder.andWhere("invoice.paidAt >= :since", { since });
    }

    const ormEntity = await queryBuilder.getOne();
    if (!ormEntity) return null;
    return InvoiceEntity.reconstitute(ormEntity);
  }

  async save(entity: InvoiceEntity): Promise<InvoiceEntity> {
    const data = entity.toPersistence();
    const saved = await this.ormRepository.save(data);
    return InvoiceEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }
}
