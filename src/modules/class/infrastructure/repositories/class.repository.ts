import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import {
    type IUnitOfWork,
    BaseTransactionalRepository,
    TypeOrmUnitOfWork,
  } from "src/core";

import { IClass } from "../../domain/types";
import { ClassModel } from "../models/class.model";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { Class } from "../../domain/entities/class.entity";

export class ClassRepository
  extends BaseTransactionalRepository<Class>
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

  async create(data: Class): Promise<Class> {
    const repository = this.getTypeOrmRepository();
    const persistenceData = data.toPersistence();
    const entityData = {
      ...persistenceData,
      createdAt: persistenceData.createdAt ?? undefined,
      updatedAt: persistenceData.updatedAt ?? undefined,
    };
    const entity = repository.create(entityData);
    const saved = await repository.save(entity);
    return Class.reconstitute(saved);
  }

  async findById(id: string): Promise<Class | null> {
    const result = await this.directRepository.findOne({ where: { id } });
    if (!result) return null;
    return Class.reconstitute(result);
  }

  async findByName(
    name: string,
    organizationId: string
  ): Promise<Class | null> {
    const result = await this.directRepository.findOne({
      where: { name, organizationId },
    });
    if (!result) return null;
    return Class.reconstitute(result);
  }

  async findByCode(code: string): Promise<Class | null> {
    const result = await this.directRepository.findOne({ where: { code } });
    if (!result) return null;
    return Class.reconstitute(result);
  }

  async findByOrganization(organizationId: string): Promise<Class[]> {
    const results = await this.directRepository.find({
      where: { organizationId },
    });
    return results.map((result) => Class.reconstitute(result));
  }

  async findByUser(userId: string): Promise<Class[]> {
    const results = await this.directRepository.find({
      where: { userId },
    });
    return results.map((result) => Class.reconstitute(result));
  }

  async findAll(): Promise<Class[]> {
    const results = await this.directRepository.find();
    return results.map((result) => Class.reconstitute(result));
  }

  async update(id: string, entity: Partial<IClass>): Promise<Class> {
    const repository = this.getTypeOrmRepository();
    const entityData = {
      ...entity,
      createdAt: entity.createdAt ?? undefined,
      updatedAt: entity.updatedAt ?? undefined,
    };
    await repository.update(id, entityData);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Class with id ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const repository = this.getTypeOrmRepository();
    await repository.delete(id);
  }

  async save(entity: Class): Promise<Class> {
    const repository = this.getTypeOrmRepository();
    const persistenceData = entity.toPersistence();
    const entityData = {
      ...persistenceData,
      createdAt: persistenceData.createdAt ?? undefined,
      updatedAt: persistenceData.updatedAt ?? undefined,
    };
    const saved = await repository.save(entityData);
    return Class.reconstitute(saved);
  }
}
