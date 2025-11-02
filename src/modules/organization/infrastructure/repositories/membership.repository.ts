import { Repository } from "typeorm";
import { IUnitOfWork, BaseTransactionalRepository } from "src/core";

import { UserModel } from "../models/user.model";
import { MembershipModel } from "../models/membership.model";
import { OrganizationModel } from "../models/organization.model";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";
import { IMembership, IUser, IOrganization, Role } from "../../domain/types";

export class MembershipRepository
  extends BaseTransactionalRepository<IMembership>
  implements IMembershipRepository
{
  constructor(unitOfWork: IUnitOfWork) {
    super(unitOfWork);
  }

  private getTypeOrmRepository(): Repository<MembershipModel> {
    const typeOrmUow = this.unitOfWork as any;
    return typeOrmUow.getEntityManager().getRepository(MembershipModel);
  }

  async create(data: IMembership): Promise<IMembership> {
    const repository = this.getTypeOrmRepository();
    const entity = repository.create(data);
    return await repository.save(entity);
  }

  async findByUser(userId: string): Promise<IMembership[]> {
    const repository = this.getTypeOrmRepository();
    return await repository.findBy({ userId });
  }

  async findByOrganization(
    organizationId: string
  ): Promise<IMembership[] | []> {
    const repository = this.getTypeOrmRepository();
    return await repository.findBy({ organizationId });
  }

  async findByUserAndOrganization(
    userId: string,
    organizationId: string
  ): Promise<IMembership | null> {
    const repository = this.getTypeOrmRepository();
    return await repository.findOneBy({ userId, organizationId });
  }

  async findById(id: string): Promise<IMembership | null> {
    const repository = this.getTypeOrmRepository();
    return await repository.findOne({ where: { id } });
  }

  async findAll(): Promise<IMembership[]> {
    const repository = this.getTypeOrmRepository();
    return await repository.find();
  }

  async update(id: string, entity: IMembership): Promise<IMembership> {
    const repository = this.getTypeOrmRepository();
    await repository.update(id, entity);
    return (await this.findById(id)) as IMembership;
  }

  async delete(id: string): Promise<void> {
    const repository = this.getTypeOrmRepository();
    await repository.delete(id);
  }

  async save(entity: IMembership): Promise<IMembership> {
    const repository = this.getTypeOrmRepository();
    return await repository.save(entity);
  }
}
