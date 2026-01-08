import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { type IUnitOfWork, BaseTransactionalRepository } from "src/core";
import { IClassStudentRepository } from "../../domain/repositories/class-student.repository";
import { ClassStudentModel } from "../models/class-student.model";
import { ClassStudentEntity } from "../../domain/entities/class-student.entity";

export class ClassStudentRepository
  extends BaseTransactionalRepository<ClassStudentEntity>
  implements IClassStudentRepository
{
  constructor(
    @InjectRepository(ClassStudentModel)
    private readonly directRepository: Repository<ClassStudentModel>,
    readonly unitOfWork: IUnitOfWork
  ) {
    super(unitOfWork);
  }

  async create(entity: ClassStudentEntity): Promise<ClassStudentEntity> {
    const persistenceData = entity.toPersistence();
    const entityData = {
      ...persistenceData,
      createdAt: persistenceData.createdAt ?? undefined,
      updatedAt: persistenceData.updatedAt ?? undefined,
    };
    const ormEntity = this.directRepository.create(entityData);
    const saved = await this.directRepository.save(ormEntity);
    return ClassStudentEntity.reconstitute(saved);
  }

  async findById(id: string): Promise<ClassStudentEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return ClassStudentEntity.reconstitute(ormEntity);
  }

  async findByClass(classId: string): Promise<ClassStudentEntity[]> {
    const ormEntities = await this.directRepository.find({
      where: { classId },
      order: { email: "ASC" },
    });
    return ormEntities.map((orm) => ClassStudentEntity.reconstitute(orm));
  }

  async findByClassAndActive(
    classId: string,
    isActive: boolean
  ): Promise<ClassStudentEntity[]> {
    const ormEntities = await this.directRepository.find({
      where: { classId, isActive },
      order: { email: "ASC" },
    });
    return ormEntities.map((orm) => ClassStudentEntity.reconstitute(orm));
  }

  async findByEmailAndClass(
    email: string,
    classId: string
  ): Promise<ClassStudentEntity | null> {
    const ormEntity = await this.directRepository.findOne({
      where: { email: email.toLowerCase().trim(), classId },
    });
    if (!ormEntity) return null;
    return ClassStudentEntity.reconstitute(ormEntity);
  }

  async delete(id: string): Promise<void> {
    await this.directRepository.delete(id);
  }

  async deleteByClass(classId: string): Promise<void> {
    await this.directRepository.delete({ classId });
  }

  async save(entity: ClassStudentEntity): Promise<ClassStudentEntity> {
    const persistenceData = entity.toPersistence();
    const saved = await this.directRepository.save(persistenceData);
    return ClassStudentEntity.reconstitute(saved);
  }

  async update(entity: ClassStudentEntity): Promise<ClassStudentEntity> {
    return this.save(entity);
  }

  async findAll(): Promise<ClassStudentEntity[]> {
    const ormEntities = await this.directRepository.find();
    return ormEntities.map((orm) => ClassStudentEntity.reconstitute(orm));
  }
}
