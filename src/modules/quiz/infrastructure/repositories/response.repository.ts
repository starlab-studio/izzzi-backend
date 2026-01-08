import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { type IUnitOfWork, BaseTransactionalRepository } from "src/core";
import { ResponseModel } from "../models/response.model";
import { IResponseRepository } from "../../domain/repositories/response.repository";
import { ResponseEntity } from "../../domain/entities/response.entity";

export class ResponseRepository
  extends BaseTransactionalRepository<ResponseEntity>
  implements IResponseRepository
{
  constructor(
    @InjectRepository(ResponseModel)
    private readonly directRepository: Repository<ResponseModel>,
    readonly unitOfWork: IUnitOfWork,
  ) {
    super(unitOfWork);
  }

  async findAll(): Promise<ResponseEntity[]> {
    const ormEntityList = await this.directRepository.find();
    return ormEntityList.map((ormEntity) =>
      ResponseEntity.reconstitute(ormEntity),
    );
  }

  async findById(id: string): Promise<ResponseEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return ResponseEntity.reconstitute(ormEntity);
  }

  async findByQuiz(quizId: string): Promise<ResponseEntity[]> {
    const ormEntityList = await this.directRepository.find({
      where: { quizId },
    });
    return ormEntityList.map((ormEntity) =>
      ResponseEntity.reconstitute(ormEntity),
    );
  }

  async findByFingerprint(fingerprint: string): Promise<ResponseEntity | null> {
    const ormEntity = await this.directRepository.findOne({
      where: { fingerprint },
    });
    if (!ormEntity) return null;
    return ResponseEntity.reconstitute(ormEntity);
  }

  async findByQuizAndFingerprint(
    quizId: string,
    fingerprint: string,
  ): Promise<ResponseEntity | null> {
    const ormEntity = await this.directRepository.findOne({
      where: { quizId, fingerprint },
    });
    if (!ormEntity) return null;
    return ResponseEntity.reconstitute(ormEntity);
  }

  async countByQuiz(quizId: string): Promise<number> {
    return await this.directRepository.count({ where: { quizId } });
  }

  async create(entity: ResponseEntity): Promise<ResponseEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.directRepository.create(data);
    const saved = await this.directRepository.save(ormEntity);
    return ResponseEntity.reconstitute(saved);
  }

  async save(entity: ResponseEntity): Promise<ResponseEntity> {
    const data = entity.toPersistence();
    const saved = await this.directRepository.save(data);
    return ResponseEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    await this.directRepository.delete(id);
  }
}
