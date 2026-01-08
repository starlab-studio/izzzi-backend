import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import {
  type IUnitOfWork,
  BaseTransactionalRepository,
  TypeOrmUnitOfWork,
} from "src/core";
import { SubjectAssignmentModel } from "../models/subject-assignment.model";
import { ISubjectAssignmentRepository } from "../../domain/repositories/subject-assignment.repository";
import { SubjectAssignmentEntity } from "../../domain/entities/subject-assignment.entity";

export class SubjectAssignmentRepository
  extends BaseTransactionalRepository<SubjectAssignmentEntity>
  implements ISubjectAssignmentRepository
{
  constructor(
    @InjectRepository(SubjectAssignmentModel)
    private readonly directRepository: Repository<SubjectAssignmentModel>,
    readonly unitOfWork: IUnitOfWork,
  ) {
    super(unitOfWork);
  }

  private getTypeOrmRepository(): Repository<SubjectAssignmentModel> {
    const typeOrmUow = this.unitOfWork as TypeOrmUnitOfWork;
    return typeOrmUow.getEntityManager().getRepository(SubjectAssignmentModel);
  }

  async create(
    entity: SubjectAssignmentEntity,
  ): Promise<SubjectAssignmentEntity> {
    return this.assign(entity);
  }

  async assign(
    entity: SubjectAssignmentEntity,
  ): Promise<SubjectAssignmentEntity> {
    const data = entity.toPersistence();

    if (!data.orderIndex || data.orderIndex <= 0) {
      const last = await this.directRepository.find({
        where: { classId: data.classId },
        order: { orderIndex: "DESC" },
        take: 1,
      });
      data.orderIndex = (last[0]?.orderIndex ?? 0) + 1;
    }

    const ormEntity = this.directRepository.create(data);
    const saved = await this.directRepository.save(ormEntity);
    return SubjectAssignmentEntity.reconstitute(saved);
  }

  async findBySubjectAndClass(
    subjectId: string,
    classId: string,
  ): Promise<SubjectAssignmentEntity | null> {
    const ormEntity = await this.directRepository.findOne({
      where: { subjectId, classId },
    });
    return ormEntity ? SubjectAssignmentEntity.reconstitute(ormEntity) : null;
  }

  async findBySubject(subjectId: string): Promise<SubjectAssignmentEntity[]> {
    const list = await this.directRepository.find({
      where: { subjectId },
    });
    return list.map((orm) => SubjectAssignmentEntity.reconstitute(orm));
  }

  async findByClass(classId: string): Promise<SubjectAssignmentEntity[]> {
    const list = await this.directRepository.find({
      where: { classId },
      order: { orderIndex: "ASC" },
    });
    return list.map((orm) => SubjectAssignmentEntity.reconstitute(orm));
  }

  async updateOrder(
    subjectId: string,
    classId: string,
    orderIndex: number,
  ): Promise<SubjectAssignmentEntity> {
    const existing = await this.directRepository.findOne({
      where: { subjectId, classId },
    });
    if (!existing) throw new Error("Assignment not found");
    existing.orderIndex = orderIndex;
    const saved = await this.directRepository.save(existing);
    return SubjectAssignmentEntity.reconstitute(saved);
  }

  async toggleActive(
    subjectId: string,
    classId: string,
    isActive: boolean,
  ): Promise<SubjectAssignmentEntity> {
    const existing = await this.directRepository.findOne({
      where: { subjectId, classId },
    });
    if (!existing) throw new Error("Assignment not found");
    existing.isActive = isActive;
    const saved = await this.directRepository.save(existing);
    return SubjectAssignmentEntity.reconstitute(saved);
  }

  async remove(subjectId: string, classId: string): Promise<void> {
    await this.directRepository.delete({ subjectId, classId });
  }

  async findById(id: string): Promise<SubjectAssignmentEntity | null> {
    const [subjectId, classId] = (id || "").split(":");
    if (!subjectId || !classId) return null;
    const ormEntity = await this.directRepository.findOne({
      where: { subjectId, classId },
    });
    return ormEntity ? SubjectAssignmentEntity.reconstitute(ormEntity) : null;
  }

  async findAll(): Promise<SubjectAssignmentEntity[]> {
    const list = await this.directRepository.find();
    return list.map((orm) => SubjectAssignmentEntity.reconstitute(orm));
  }

  async delete(id: string): Promise<void> {
    const [subjectId, classId] = (id || "").split(":");
    if (!subjectId || !classId) return;
    await this.directRepository.delete({ subjectId, classId });
  }

  async save(
    entity: SubjectAssignmentEntity,
  ): Promise<SubjectAssignmentEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.directRepository.create(data);
    const saved = await this.directRepository.save(ormEntity);
    return SubjectAssignmentEntity.reconstitute(saved);
  }
}
