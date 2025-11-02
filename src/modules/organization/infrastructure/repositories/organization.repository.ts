import { Repository } from "typeorm";
import { IUnitOfWork, BaseTransactionalRepository } from "src/core";

import { IOrganization, IOrganizationCreate } from "../../domain/types";
import { OrganizationModel } from "../models/organization.model";
import { IOrganizationRepository } from "../../domain/repositories/organization.repository";

export class OrganizationRepository
  extends BaseTransactionalRepository<IOrganization>
  implements IOrganizationRepository
{
  constructor(unitOfWork: IUnitOfWork) {
    super(unitOfWork);
  }

  private getTypeOrmRepository(): Repository<OrganizationModel> {
    // Cast vers TypeOrmUnitOfWork pour accéder à l'EntityManager
    const typeOrmUow = this.unitOfWork as any;
    return typeOrmUow.getEntityManager().getRepository(OrganizationModel);
  }

  async create(data: IOrganizationCreate): Promise<IOrganization> {
    const repository = this.getTypeOrmRepository();
    const entity = repository.create(data);
    return await repository.save(entity);
  }

  async findById(id: string): Promise<IOrganization | null> {
    const repository = this.getTypeOrmRepository();
    return await repository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<IOrganization | null> {
    const repository = this.getTypeOrmRepository();
    return await repository.findOneBy({ name });
  }

  async findBySlug(slug: string): Promise<IOrganization | null> {
    const repository = this.getTypeOrmRepository();
    return await repository.findOneBy({ slug });
  }

  async findByOwner(ownerId: string): Promise<IOrganization[] | []> {
    const repository = this.getTypeOrmRepository();
    return await repository.findBy({ ownerId });
  }

  async findAll(): Promise<IOrganization[]> {
    const repository = this.getTypeOrmRepository();
    return await repository.find();
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
