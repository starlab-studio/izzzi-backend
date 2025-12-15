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
import { ClassEntity } from "../../domain/entities/class.entity";

export class ClassRepository
  extends BaseTransactionalRepository<ClassEntity>
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

  async create(data: ClassEntity): Promise<ClassEntity> {
    const persistenceData = data.toPersistence();
    const entityData = {
      ...persistenceData,
      createdAt: persistenceData.createdAt ?? undefined,
      updatedAt: persistenceData.updatedAt ?? undefined,
    };
    const entity = this.directRepository.create(entityData);
    const saved = await this.directRepository.save(entity);
    return ClassEntity.reconstitute(saved);
  }

  async findById(id: string): Promise<ClassEntity | null> {
    const result = await this.directRepository.findOne({ where: { id } });
    if (!result) return null;
    return ClassEntity.reconstitute(result);
  }

  async findByNameAndOrganization( // Renommé
    name: string,
    organizationId: string
  ): Promise<ClassEntity | null> {
    const result = await this.directRepository.findOne({
      where: { name, organizationId },
    });
    if (!result) return null;
    return ClassEntity.reconstitute(result);
  }

  async findByCode(code: string): Promise<ClassEntity | null> {
    const result = await this.directRepository.findOne({ where: { code } });
    if (!result) return null;
    return ClassEntity.reconstitute(result);
  }

  async findByOrganization(organizationId: string): Promise<ClassEntity[]> {
    const results = await this.directRepository.find({
      where: { organizationId },
    });
    return results.map((result) => ClassEntity.reconstitute(result));
  }

  async findByOrganizationAndStatus(organizationId: string, isActive: boolean): Promise<ClassEntity[]> {
    const results = await this.directRepository.find({
      where: { organizationId, isActive },
    });
    return results.map((result) => ClassEntity.reconstitute(result));
  }

  async findByUser(userId: string): Promise<ClassEntity[]> {
    const results = await this.directRepository.find({
      where: { userId },
    });
    return results.map((result) => ClassEntity.reconstitute(result));
  }

  async findAll(): Promise<ClassEntity[]> {
    const results = await this.directRepository.find();
    return results.map((result) => ClassEntity.reconstitute(result));
  }

  async update(id: string, entity: Partial<IClass>): Promise<ClassEntity> {
    const entityData = {
      ...entity,
      createdAt: entity.createdAt ?? undefined,
      updatedAt: entity.updatedAt ?? undefined,
    };
    await this.directRepository.update(id, entityData);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Class with id ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.directRepository.delete(id);
  }

  async save(entity: ClassEntity): Promise<ClassEntity> {
    const persistenceData = entity.toPersistence();
    const entityData = {
      ...persistenceData,
      createdAt: persistenceData.createdAt ?? undefined,
      updatedAt: persistenceData.updatedAt ?? undefined,
    };
    const saved = await this.directRepository.save(entityData);
    return ClassEntity.reconstitute(saved);
  }
}
