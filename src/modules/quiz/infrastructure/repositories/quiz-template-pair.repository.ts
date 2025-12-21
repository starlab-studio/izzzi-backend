import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import {
  type IUnitOfWork,
  BaseTransactionalRepository,
} from "src/core";
import { QuizTemplatePairModel } from "../models/quiz-template-pair.model";
import { IQuizTemplatePairRepository } from "../../domain/repositories/quiz-template-pair.repository";
import { QuizTemplatePairEntity } from "../../domain/entities/quiz-template-pair.entity";

export class QuizTemplatePairRepository
  extends BaseTransactionalRepository<QuizTemplatePairEntity>
  implements IQuizTemplatePairRepository
{
  constructor(
    @InjectRepository(QuizTemplatePairModel)
    private readonly directRepository: Repository<QuizTemplatePairModel>,
    readonly unitOfWork: IUnitOfWork,
  ) {
    super(unitOfWork);
  }

  async findAll(): Promise<QuizTemplatePairEntity[]> {
    const ormEntityList = await this.directRepository.find();
    return ormEntityList.map((ormEntity) =>
      QuizTemplatePairEntity.reconstitute(ormEntity),
    );
  }

  async findAllActive(): Promise<QuizTemplatePairEntity[]> {
    const ormEntityList = await this.directRepository.find({
      where: { isActive: true },
      order: { displayOrder: "ASC" },
    });
    return ormEntityList.map((ormEntity) =>
      QuizTemplatePairEntity.reconstitute(ormEntity),
    );
  }

  async findById(id: string): Promise<QuizTemplatePairEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return QuizTemplatePairEntity.reconstitute(ormEntity);
  }

  async create(entity: QuizTemplatePairEntity): Promise<QuizTemplatePairEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.directRepository.create(data);
    const saved = await this.directRepository.save(ormEntity);
    return QuizTemplatePairEntity.reconstitute(saved);
  }

  async save(entity: QuizTemplatePairEntity): Promise<QuizTemplatePairEntity> {
    const data = entity.toPersistence();
    const saved = await this.directRepository.save(data);
    return QuizTemplatePairEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    await this.directRepository.delete(id);
  }
}

