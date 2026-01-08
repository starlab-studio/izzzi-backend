import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { type IUnitOfWork, BaseTransactionalRepository } from "src/core";
import { SubjectSummaryModel } from "../models/subject-summary.model";
import { ISubjectSummaryRepository } from "../../domain/repositories/subject-summary.repository";
import { SubjectSummaryEntity } from "../../domain/entities/subject-summary.entity";
import { ISubjectSummary } from "../../domain/types";

export class SubjectSummaryRepository
  extends BaseTransactionalRepository<SubjectSummaryEntity>
  implements ISubjectSummaryRepository
{
  constructor(
    @InjectRepository(SubjectSummaryModel)
    private readonly directRepository: Repository<SubjectSummaryModel>,
    readonly unitOfWork: IUnitOfWork,
  ) {
    super(unitOfWork);
  }

  private toDomain(model: SubjectSummaryModel): ISubjectSummary {
    return {
      id: model.id,
      subjectId: model.subjectId,
      organizationId: model.organizationId,
      summary: model.summary,
      fullSummary: model.fullSummary,
      sentimentScore: model.sentimentScore
        ? Number(model.sentimentScore)
        : undefined,
      periodDays: model.periodDays,
      formType: model.formType,
      feedbackCountAtGeneration: model.feedbackCountAtGeneration,
      generatedAt: model.generatedAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  async create(entity: SubjectSummaryEntity): Promise<SubjectSummaryEntity> {
    const persistence = entity.toPersistence();
    const ormEntity = this.directRepository.create(persistence);
    const saved = await this.directRepository.save(ormEntity);
    return SubjectSummaryEntity.reconstitute(this.toDomain(saved));
  }

  async update(
    id: string,
    entity: Partial<SubjectSummaryEntity>,
  ): Promise<SubjectSummaryEntity> {
    const persistence = (entity as SubjectSummaryEntity).toPersistence();
    await this.directRepository.update(id, persistence);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`SubjectSummary with id ${id} not found`);
    }
    return updated;
  }

  async findById(id: string): Promise<SubjectSummaryEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return SubjectSummaryEntity.reconstitute(this.toDomain(ormEntity));
  }

  async findBySubjectIdAndFormType(
    subjectId: string,
    periodDays: number,
    formType: "during_course" | "after_course",
  ): Promise<SubjectSummaryEntity | null> {
    const ormEntity = await this.directRepository.findOne({
      where: { subjectId, periodDays, formType },
    });
    if (!ormEntity) return null;
    return SubjectSummaryEntity.reconstitute(this.toDomain(ormEntity));
  }

  async findBySubjectIdsAndFormType(
    subjectIds: string[],
    periodDays: number,
    formType: "during_course" | "after_course",
  ): Promise<SubjectSummaryEntity[]> {
    if (subjectIds.length === 0) {
      return [];
    }
    const ormEntityList = await this.directRepository
      .createQueryBuilder("summary")
      .where("summary.subject_id IN (:...subjectIds)", { subjectIds })
      .andWhere("summary.period_days = :periodDays", { periodDays })
      .andWhere("summary.form_type = :formType", { formType })
      .getMany();
    return ormEntityList.map((ormEntity) =>
      SubjectSummaryEntity.reconstitute(this.toDomain(ormEntity)),
    );
  }

  async upsert(entity: SubjectSummaryEntity): Promise<SubjectSummaryEntity> {
    const existing = await this.findBySubjectIdAndFormType(
      entity.subjectId,
      entity.periodDays,
      entity.formType,
    );

    if (existing) {
      existing.update({
        summary: entity.summary,
        fullSummary: entity.fullSummary,
        sentimentScore: entity.sentimentScore,
        feedbackCountAtGeneration: entity.feedbackCountAtGeneration,
        generatedAt: entity.generatedAt,
      });
      return this.update(existing.id, existing);
    }

    return this.create(entity);
  }

  async save(entity: SubjectSummaryEntity): Promise<SubjectSummaryEntity> {
    const persistence = entity.toPersistence();
    await this.directRepository.update(entity.id, persistence);
    const updated = await this.findById(entity.id);
    if (!updated) {
      throw new Error("Failed to save SubjectSummaryEntity");
    }
    return updated;
  }

  async findAll(): Promise<SubjectSummaryEntity[]> {
    const ormEntityList = await this.directRepository.find();
    return ormEntityList.map((ormEntity) =>
      SubjectSummaryEntity.reconstitute(this.toDomain(ormEntity)),
    );
  }

  async delete(id: string): Promise<void> {
    await this.directRepository.delete(id);
  }
}
