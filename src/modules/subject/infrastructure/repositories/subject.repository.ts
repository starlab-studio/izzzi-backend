import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import {
  type IUnitOfWork,
  BaseTransactionalRepository,
  TypeOrmUnitOfWork,
} from "src/core";

import { ISubject, ISubjectCreate } from "../../domain/types";
import { SubjectModel } from "../models/subject.model";
import { ISubjectRepository } from "../../domain/repositories/subject.repository";

export class SubjectRepository
  extends BaseTransactionalRepository<ISubject>
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

  async create(data: ISubjectCreate): Promise<ISubject> {
    const repository = this.getTypeOrmRepository();
    const entity = repository.create(data);
    return await repository.save(entity);
  }

  async findById(id: string): Promise<ISubject | null> {
    return await this.directRepository.findOne({ where: { id } });
  }

  async findByName(
    name: string,
    organizationId: string,
  ): Promise<ISubject | null> {
    return await this.directRepository.findOne({
      where: { name, organizationId },
    });
  }

  async findByOrganization(organizationId: string): Promise<ISubject[]> {
    return await this.directRepository.find({
      where: { organizationId },
    });
  }

  async findByUser(userId: string): Promise<ISubject[]> {
    return await this.directRepository.find({
      where: { userId },
    });
  }

  async findAll(): Promise<ISubject[]> {
    return await this.directRepository.find();
  }

  async update(id: string, entity: Partial<ISubject>): Promise<ISubject> {
    const repository = this.getTypeOrmRepository();
    await repository.update(id, entity);
    return (await this.findById(id)) as ISubject;
  }

  async delete(id: string): Promise<void> {
    const repository = this.getTypeOrmRepository();
    await repository.delete(id);
  }

  async save(entity: ISubject): Promise<ISubject> {
    const repository = this.getTypeOrmRepository();
    return await repository.save(entity);
  }
}
