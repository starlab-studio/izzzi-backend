import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import {
  type IUnitOfWork,
  BaseTransactionalRepository,
} from "src/core";
import { QuizModel } from "../models/quiz.model";
import { IQuizRepository } from "../../domain/repositories/quiz.repository";
import { QuizEntity } from "../../domain/entities/quiz.entity";

export class QuizRepository
  extends BaseTransactionalRepository<QuizEntity>
  implements IQuizRepository
{
  constructor(
    @InjectRepository(QuizModel)
    private readonly directRepository: Repository<QuizModel>,
    readonly unitOfWork: IUnitOfWork,
  ) {
    super(unitOfWork);
  }

  async create(entity: QuizEntity): Promise<QuizEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.directRepository.create(data);
    const saved = await this.directRepository.save(ormEntity);
    return QuizEntity.reconstitute(saved);
  }

  async findById(id: string): Promise<QuizEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return QuizEntity.reconstitute(ormEntity);
  }

  async findByAccessToken(accessToken: string): Promise<QuizEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { accessToken } });
    if (!ormEntity) return null;
    return QuizEntity.reconstitute(ormEntity);
  }

  async findBySubject(subjectId: string): Promise<QuizEntity[]> {
    const ormEntityList = await this.directRepository.find({
      where: { subjectId },
      order: { type: "ASC" },
    });
    return ormEntityList.map((ormEntity) =>
      QuizEntity.reconstitute(ormEntity),
    );
  }

  async findBySubjectAndType(
    subjectId: string,
    type: "during_course" | "after_course",
  ): Promise<QuizEntity | null> {
    const ormEntity = await this.directRepository.findOne({
      where: { subjectId, type },
    });
    if (!ormEntity) return null;
    return QuizEntity.reconstitute(ormEntity);
  }

  async save(entity: QuizEntity): Promise<QuizEntity> {
    const data = entity.toPersistence();
    const saved = await this.directRepository.save(data);
    return QuizEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    await this.directRepository.delete(id);
  }

  async findAll(): Promise<QuizEntity[]> {
    const ormEntityList = await this.directRepository.find();
    return ormEntityList.map((ormEntity) =>
      QuizEntity.reconstitute(ormEntity),
    );
  }
}

