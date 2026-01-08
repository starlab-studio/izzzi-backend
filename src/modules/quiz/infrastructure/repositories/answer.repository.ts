import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { type IUnitOfWork, BaseTransactionalRepository } from "src/core";
import { AnswerModel } from "../models/answer.model";
import { IAnswerRepository } from "../../domain/repositories/answer.repository";
import { AnswerEntity } from "../../domain/entities/answer.entity";

export class AnswerRepository
  extends BaseTransactionalRepository<AnswerEntity>
  implements IAnswerRepository
{
  constructor(
    @InjectRepository(AnswerModel)
    private readonly directRepository: Repository<AnswerModel>,
    readonly unitOfWork: IUnitOfWork,
  ) {
    super(unitOfWork);
  }

  async findAll(): Promise<AnswerEntity[]> {
    const ormEntityList = await this.directRepository.find();
    return ormEntityList.map((ormEntity) =>
      AnswerEntity.reconstitute(ormEntity),
    );
  }

  async findById(id: string): Promise<AnswerEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return AnswerEntity.reconstitute(ormEntity);
  }

  async findByResponse(responseId: string): Promise<AnswerEntity[]> {
    const ormEntityList = await this.directRepository.find({
      where: { responseId },
    });
    return ormEntityList.map((ormEntity) =>
      AnswerEntity.reconstitute(ormEntity),
    );
  }

  async findByQuiz(quizId: string): Promise<AnswerEntity[]> {
    const ormEntityList = await this.directRepository
      .createQueryBuilder("answer")
      .innerJoin("responses", "response", "response.id = answer.response_id")
      .where("response.quiz_id = :quizId", { quizId })
      .getMany();
    return ormEntityList.map((ormEntity) =>
      AnswerEntity.reconstitute(ormEntity),
    );
  }

  async create(entity: AnswerEntity): Promise<AnswerEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.directRepository.create(data);
    const saved = await this.directRepository.save(ormEntity);
    return AnswerEntity.reconstitute(saved);
  }

  async save(entity: AnswerEntity): Promise<AnswerEntity> {
    const data = entity.toPersistence();
    const saved = await this.directRepository.save(data);
    return AnswerEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    await this.directRepository.delete(id);
  }
}
