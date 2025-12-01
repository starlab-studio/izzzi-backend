import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import {
    type IUnitOfWork,
    BaseTransactionalRepository,
    TypeOrmUnitOfWork,
  } from "src/core";

import { IClass, IClassCreate } from "../../domain/types";
import { ClassModel } from "../models/class.model";
import { IClassRepository } from "../../domain/repositories/class.repository";

export class ClassRepository
  extends BaseTransactionalRepository<IClass>
  implements IClassRepository
{
  constructor(
    @InjectRepository(ClassModel)
    private readonly directRepository: Repository<ClassModel>,
    readonly unitOfWork: IUnitOfWork
  ) {
    super(unitOfWork);
  }

  private getTypeOrmRepository(): Repository<ClassModel> {
    const typeOrmUow = this.unitOfWork as TypeOrmUnitOfWork;
    return typeOrmUow.getEntityManager().getRepository(ClassModel);
  }

  async create(data: IClass): Promise<IClass> { 
    const repository = this.getTypeOrmRepository();
    const entity = repository.create(data);
    return await repository.save(entity);
  }

  async findById(id: string): Promise<IClass | null> {
    return await this.directRepository.findOne({ where: { id } });
  }

  async findByName(
    name: string,
    organizationId: string
  ): Promise<IClass | null> {
    return await this.directRepository.findOne({
      where: { name, organizationId },
    });
  }

  async findByCode(code: string): Promise<IClass | null> {
    return await this.directRepository.findOne({ where: { code } });
  }

  async findByOrganization(organizationId: string): Promise<IClass[]> {
    return await this.directRepository.find({
      where: { organizationId },
    });
  }

  async findByUser(userId: string): Promise<IClass[]> {
    return await this.directRepository.find({
      where: { userId },
    });
  }

  async findAll(): Promise<IClass[]> {
    return await this.directRepository.find();
  }

  async update(id: string, entity: Partial<IClass>): Promise<IClass> {
    const repository = this.getTypeOrmRepository();
    await repository.update(id, entity);
    return (await this.findById(id)) as IClass;
  }

  async delete(id: string): Promise<void> {
    const repository = this.getTypeOrmRepository();
    await repository.delete(id);
  }

  async save(entity: IClass): Promise<IClass> {
    const repository = this.getTypeOrmRepository();
    return await repository.save(entity);
  }
}
