import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { type IUnitOfWork, BaseTransactionalRepository } from "src/core";
import { AlertCommentModel } from "../models/alert-comment.model";
import { IAlertCommentRepository } from "../../domain/repositories/alert-comment.repository";
import { AlertCommentEntity } from "../../domain/entities/alert-comment.entity";

export class AlertCommentRepository
  extends BaseTransactionalRepository<AlertCommentEntity>
  implements IAlertCommentRepository
{
  constructor(
    @InjectRepository(AlertCommentModel)
    private readonly directRepository: Repository<AlertCommentModel>,
    readonly unitOfWork: IUnitOfWork,
  ) {
    super(unitOfWork);
  }

  async findById(id: string): Promise<AlertCommentEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return AlertCommentEntity.reconstitute(ormEntity);
  }

  async findByAlertId(
    alertId: string,
    subjectId: string,
  ): Promise<AlertCommentEntity[]> {
    const ormEntityList = await this.directRepository.find({
      where: { alertId, subjectId },
      order: { createdAt: "ASC" },
    });
    return ormEntityList.map((ormEntity) =>
      AlertCommentEntity.reconstitute(ormEntity),
    );
  }

  async create(entity: AlertCommentEntity): Promise<AlertCommentEntity> {
    const persistence = entity.toPersistence();
    const ormEntity = this.directRepository.create(persistence);
    const saved = await this.directRepository.save(ormEntity);
    return AlertCommentEntity.reconstitute(saved);
  }

  async save(entity: AlertCommentEntity): Promise<AlertCommentEntity> {
    const persistence = entity.toPersistence();
    await this.directRepository.update(entity.id, persistence);
    const updated = await this.findById(entity.id);
    if (!updated) {
      throw new Error("Failed to save AlertCommentEntity");
    }
    return updated;
  }

  async findAll(): Promise<AlertCommentEntity[]> {
    const ormEntityList = await this.directRepository.find();
    return ormEntityList.map((ormEntity) =>
      AlertCommentEntity.reconstitute(ormEntity),
    );
  }

  async delete(id: string): Promise<void> {
    await this.directRepository.delete(id);
  }
}
