import { Repository, In } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { type IUnitOfWork, BaseTransactionalRepository } from "src/core";
import { FeedbackAlertModel } from "../models/feedback-alert.model";
import { IFeedbackAlertRepository } from "../../domain/repositories/feedback-alert.repository";
import { FeedbackAlertEntity } from "../../domain/entities/feedback-alert.entity";

export class FeedbackAlertRepository
  extends BaseTransactionalRepository<FeedbackAlertEntity>
  implements IFeedbackAlertRepository
{
  constructor(
    @InjectRepository(FeedbackAlertModel)
    private readonly directRepository: Repository<FeedbackAlertModel>,
    readonly unitOfWork: IUnitOfWork
  ) {
    super(unitOfWork);
  }

  async findById(id: string): Promise<FeedbackAlertEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return FeedbackAlertEntity.reconstitute(ormEntity);
  }

  async findByAlertId(
    alertId: string,
    subjectId: string
  ): Promise<FeedbackAlertEntity | null> {
    const ormEntity = await this.directRepository.findOne({
      where: { alertId, subjectId },
    });
    if (!ormEntity) return null;
    return FeedbackAlertEntity.reconstitute(ormEntity);
  }

  async findBySubjectId(subjectId: string): Promise<FeedbackAlertEntity[]> {
    const ormEntityList = await this.directRepository.find({
      where: { subjectId },
    });
    return ormEntityList.map((ormEntity) =>
      FeedbackAlertEntity.reconstitute(ormEntity)
    );
  }

  async findBySubjectIds(subjectIds: string[]): Promise<FeedbackAlertEntity[]> {
    if (subjectIds.length === 0) {
      return [];
    }
    const ormEntityList = await this.directRepository.find({
      where: { subjectId: In(subjectIds) },
    });
    return ormEntityList.map((ormEntity) =>
      FeedbackAlertEntity.reconstitute(ormEntity)
    );
  }

  async create(entity: FeedbackAlertEntity): Promise<FeedbackAlertEntity> {
    const persistence = entity.toPersistence();
    const ormEntity = this.directRepository.create(persistence);
    const saved = await this.directRepository.save(ormEntity);
    return FeedbackAlertEntity.reconstitute(saved);
  }

  async save(entity: FeedbackAlertEntity): Promise<FeedbackAlertEntity> {
    const persistence = entity.toPersistence();
    await this.directRepository.update(entity.id, persistence);
    const updated = await this.findById(entity.id);
    if (!updated) {
      throw new Error("Failed to save FeedbackAlertEntity");
    }
    return updated;
  }

  async findAll(): Promise<FeedbackAlertEntity[]> {
    const ormEntityList = await this.directRepository.find();
    return ormEntityList.map((ormEntity) =>
      FeedbackAlertEntity.reconstitute(ormEntity)
    );
  }

  async delete(id: string): Promise<void> {
    await this.directRepository.delete(id);
  }
}
