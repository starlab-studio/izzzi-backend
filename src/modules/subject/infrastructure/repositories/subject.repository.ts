import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import {
  type IUnitOfWork,
  BaseTransactionalRepository,
  TypeOrmUnitOfWork,
} from "src/core";
import { SubjectModel } from "../models/subject.model";
import { ISubjectRepository } from "../../domain/repositories/subject.repository";
import { SubjectEntity } from "../../domain/entities/subject.entity";

export class SubjectRepository
  extends BaseTransactionalRepository<SubjectEntity>
  implements ISubjectRepository
{
  constructor(
    @InjectRepository(SubjectModel)
    private readonly directRepository: Repository<SubjectModel>,
    readonly unitOfWork: IUnitOfWork,
  ) {
    super(unitOfWork);
  }

  private getTypeOrmRepository(): Repository<SubjectModel> {
    const typeOrmUow = this.unitOfWork as TypeOrmUnitOfWork;
    return typeOrmUow.getEntityManager().getRepository(SubjectModel);
  }

  async create(entity: SubjectEntity): Promise<SubjectEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.directRepository.create(data);
    const saved = await this.directRepository.save(ormEntity);
    return SubjectEntity.reconstitute(saved);
  }

  async findById(id: string): Promise<SubjectEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return SubjectEntity.reconstitute(ormEntity);
  }

  async findByName(
    name: string,
    organizationId: string,
  ): Promise<SubjectEntity | null> {
    const ormEntity = await this.directRepository.findOne({
      where: { name, organizationId },
    });
    if (!ormEntity) return null;
    return SubjectEntity.reconstitute(ormEntity);
  }

  async findByOrganization(organizationId: string): Promise<SubjectEntity[]> {
    const ormEntityList = await this.directRepository.find({
      where: { organizationId },
    });
    return ormEntityList.map((ormEntity) =>
      SubjectEntity.reconstitute(ormEntity),
    );
  }

  async findByUser(userId: string): Promise<SubjectEntity[]> {
    const ormEntityList = await this.directRepository.find({
      where: { createdBy: userId },
    });
    return ormEntityList.map((ormEntity) =>
      SubjectEntity.reconstitute(ormEntity),
    );
  }

  async findAll(): Promise<SubjectEntity[]> {
    const ormEntityList = await this.directRepository.find();
    return ormEntityList.map((ormEntity) =>
      SubjectEntity.reconstitute(ormEntity),
    );
  }

  async delete(id: string): Promise<void> {
    await this.directRepository.delete(id);
  }

  async save(entity: SubjectEntity): Promise<SubjectEntity> {
    const data = entity.toPersistence();
    const saved = await this.directRepository.save(data);
    return SubjectEntity.reconstitute(saved);
  }
}
