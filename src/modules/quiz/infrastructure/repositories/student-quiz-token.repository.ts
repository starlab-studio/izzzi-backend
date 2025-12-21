import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import {
  type IUnitOfWork,
  BaseTransactionalRepository,
} from "src/core";
import { StudentQuizTokenModel } from "../models/student-quiz-token.model";
import { IStudentQuizTokenRepository } from "../../domain/repositories/student-quiz-token.repository";
import { StudentQuizTokenEntity } from "../../domain/entities/student-quiz-token.entity";

export class StudentQuizTokenRepository
  extends BaseTransactionalRepository<StudentQuizTokenEntity>
  implements IStudentQuizTokenRepository
{
  constructor(
    @InjectRepository(StudentQuizTokenModel)
    private readonly directRepository: Repository<StudentQuizTokenModel>,
    readonly unitOfWork: IUnitOfWork,
  ) {
    super(unitOfWork);
  }

  async create(entity: StudentQuizTokenEntity): Promise<StudentQuizTokenEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.directRepository.create(data);
    const saved = await this.directRepository.save(ormEntity);
    return StudentQuizTokenEntity.reconstitute(saved);
  }

  async findAll(): Promise<StudentQuizTokenEntity[]> {
    const ormEntityList = await this.directRepository.find();
    return ormEntityList.map((ormEntity) =>
      StudentQuizTokenEntity.reconstitute(ormEntity),
    );
  }

  async findById(id: string): Promise<StudentQuizTokenEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return StudentQuizTokenEntity.reconstitute(ormEntity);
  }

  async findByQuiz(quizId: string): Promise<StudentQuizTokenEntity[]> {
    const ormEntityList = await this.directRepository.find({
      where: { quizId },
    });
    return ormEntityList.map((ormEntity) =>
      StudentQuizTokenEntity.reconstitute(ormEntity),
    );
  }

  async findByQuizAndNotResponded(quizId: string): Promise<StudentQuizTokenEntity[]> {
    const ormEntityList = await this.directRepository.find({
      where: { quizId, hasResponded: false },
    });
    return ormEntityList.map((ormEntity) =>
      StudentQuizTokenEntity.reconstitute(ormEntity),
    );
  }

  async findByToken(token: string): Promise<StudentQuizTokenEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { token } });
    if (!ormEntity) return null;
    return StudentQuizTokenEntity.reconstitute(ormEntity);
  }

  async save(entity: StudentQuizTokenEntity): Promise<StudentQuizTokenEntity> {
    const data = entity.toPersistence();
    const saved = await this.directRepository.save(data);
    return StudentQuizTokenEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    await this.directRepository.delete(id);
  }
}

