import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { MembershipModel } from "../models/membership.model";
import { MembershipEntity } from "../../domain/entities/membership.entity";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";
import { type IUnitOfWork, BaseTransactionalRepository } from "src/core";

export class MembershipRepository
  extends BaseTransactionalRepository<MembershipEntity>
  implements IMembershipRepository
{
  constructor(
    @InjectRepository(MembershipModel)
    private readonly directRepository: Repository<MembershipModel>,
    unitOfWork: IUnitOfWork
  ) {
    super(unitOfWork);
  }

  private getTypeOrmRepository(): Repository<MembershipModel> {
    const typeOrmUow = this.unitOfWork as any;
    return typeOrmUow.getEntityManager().getRepository(MembershipModel);
  }

  async create(entity: MembershipEntity): Promise<MembershipEntity> {
    const repository = this.getTypeOrmRepository();
    const data = entity.toPersistance();
    const ormEntity = repository.create(data);
    const saved = await repository.save(ormEntity);
    return MembershipEntity.reconstitute(saved);
  }

  async findByUser(userId: string): Promise<MembershipEntity[]> {
    const ormEntities = await this.directRepository.findBy({ userId });
    return this.toEntities(ormEntities);
  }

  async findByOrganization(
    organizationId: string
  ): Promise<MembershipEntity[] | []> {
    const ormEntities = await this.directRepository.findBy({ organizationId });
    return this.toEntities(ormEntities);
  }

  async findByUserAndOrganization(
    userId: string,
    organizationId: string
  ): Promise<MembershipEntity | null> {
    const ormEntity = await this.directRepository.findOneBy({
      userId,
      organizationId,
    });
    return this.toEntity(ormEntity);
  }

  async findById(id: string): Promise<MembershipEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    return this.toEntity(ormEntity);
  }

  async findAll(): Promise<MembershipEntity[]> {
    const ormEntities = await this.directRepository.find();
    return this.toEntities(ormEntities);
  }

  async save(entity: MembershipEntity): Promise<MembershipEntity> {
    const repository = this.getTypeOrmRepository();
    const data = entity.toPersistance();
    const ormEntity = await repository.save(data);
    return MembershipEntity.reconstitute(ormEntity);
  }

  async delete(id: string): Promise<void> {
    const repository = this.getTypeOrmRepository();
    await repository.delete(id);
  }

  private toEntity(model: MembershipModel | null): MembershipEntity | null {
    return model ? MembershipEntity.reconstitute(model) : null;
  }

  private toEntities(models: MembershipModel[]): MembershipEntity[] {
    return models.map((m) => MembershipEntity.reconstitute(m));
  }
}
