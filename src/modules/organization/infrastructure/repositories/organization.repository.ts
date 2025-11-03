import { Repository } from "typeorm";
import { type IUnitOfWork, BaseTransactionalRepository } from "src/core";

import { IOrganization, IOrganizationCreate } from "../../domain/types";
import { OrganizationModel } from "../models/organization.model";
import { IOrganizationRepository } from "../../domain/repositories/organization.repository";
import { InjectRepository } from "@nestjs/typeorm";

export class OrganizationRepository
  extends BaseTransactionalRepository<IOrganization>
  implements IOrganizationRepository
{
  constructor(
    @InjectRepository(OrganizationModel)
    private readonly directRepository: Repository<OrganizationModel>,
    unitOfWork: IUnitOfWork
  ) {
    super(unitOfWork);
  }

  private getTypeOrmRepository(): Repository<OrganizationModel> {
    const typeOrmUow = this.unitOfWork as any;
    return typeOrmUow.getEntityManager().getRepository(OrganizationModel);
  }

  async create(data: IOrganizationCreate): Promise<IOrganization> {
    const repository = this.getTypeOrmRepository();
    const entity = repository.create(data);
    return await repository.save(entity);
  }

  async findById(id: string): Promise<IOrganization | null> {
    return await this.directRepository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<IOrganization | null> {
    return await this.directRepository.findOneBy({ name });
  }

  async findBySlug(slug: string): Promise<IOrganization | null> {
    return await this.directRepository.findOneBy({ slug });
  }

  async findByOwner(ownerId: string): Promise<IOrganization[] | []> {
    return await this.directRepository.findBy({ ownerId });
  }

  async findAll(): Promise<IOrganization[]> {
    return await this.directRepository.find();
  }

  async update(id: string, entity: IOrganization): Promise<IOrganization> {
    const repository = this.getTypeOrmRepository();
    await repository.update(id, entity);
    return (await this.findById(id)) as IOrganization;
  }

  async delete(id: string): Promise<void> {
    const repository = this.getTypeOrmRepository();
    await repository.delete(id);
  }

  async save(entity: IOrganization): Promise<IOrganization> {
    const repository = this.getTypeOrmRepository();
    return await repository.save(entity);
  }
}
