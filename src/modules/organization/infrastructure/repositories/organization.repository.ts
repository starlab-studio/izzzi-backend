import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { type IUnitOfWork, BaseTransactionalRepository } from "src/core";
import { OrganizationEntity } from "../../domain/entities/organization.entity";
import { OrganizationModel } from "../models/organization.model";
import { IOrganizationRepository } from "../../domain/repositories/organization.repository";

export class OrganizationRepository
  extends BaseTransactionalRepository<OrganizationEntity>
  implements IOrganizationRepository
{
  constructor(
    @InjectRepository(OrganizationModel)
    private readonly directRepository: Repository<OrganizationModel>,
    unitOfWork: IUnitOfWork,
  ) {
    super(unitOfWork);
  }

  private getTypeOrmRepository(): Repository<OrganizationModel> {
    const typeOrmUow = this.unitOfWork as any;
    return typeOrmUow.getEntityManager().getRepository(OrganizationModel);
  }

  async create(entity: OrganizationEntity): Promise<OrganizationEntity> {
    const repository = this.getTypeOrmRepository();
    const data = entity.toPersistence();
    const ormEntity = repository.create(data);
    const saved = await repository.save(ormEntity);
    return OrganizationEntity.reconstitute(saved);
  }

  async findById(id: string): Promise<OrganizationEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    return this.toEntity(ormEntity);
  }

  async findByName(name: string): Promise<OrganizationEntity | null> {
    const ormEntity = await this.directRepository.findOneBy({ name });
    return this.toEntity(ormEntity);
  }

  async findBySlug(slug: string): Promise<OrganizationEntity | null> {
    const ormEntity = await this.directRepository.findOneBy({ slug });
    return this.toEntity(ormEntity);
  }

  async findByOwner(ownerId: string): Promise<OrganizationEntity[] | []> {
    const ormEntities = await this.directRepository.findBy({ ownerId });
    return this.toEntities(ormEntities);
  }

  async findAll(): Promise<OrganizationEntity[]> {
    const ormEntities = await this.directRepository.find();
    return this.toEntities(ormEntities);
  }

  async save(entity: OrganizationEntity): Promise<OrganizationEntity> {
    const repository = this.getTypeOrmRepository();
    const data = entity.toPersistence();
    const saved = await repository.save(data);
    return OrganizationEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    const repository = this.getTypeOrmRepository();
    await repository.delete(id);
  }

  private toEntity(model: OrganizationModel | null): OrganizationEntity | null {
    return model ? OrganizationEntity.reconstitute(model) : null;
  }

  private toEntities(models: OrganizationModel[]): OrganizationEntity[] {
    return models.map((m) => OrganizationEntity.reconstitute(m));
  }
}
