import { Repository } from "typeorm";
import { type IUnitOfWork, BaseTransactionalRepository } from "src/core";

import { MembershipModel } from "../models/membership.model";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";
import { IMembership } from "../../domain/types";
import { InjectRepository } from "@nestjs/typeorm";

export class MembershipRepository
  extends BaseTransactionalRepository<IMembership>
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

  async create(data: IMembership): Promise<IMembership> {
    const repository = this.getTypeOrmRepository();
    const entity = repository.create(data);
    return await repository.save(entity);
  }

  async findByUser(userId: string): Promise<IMembership[]> {
    return await this.directRepository.findBy({ userId });
  }

  async findByOrganization(
    organizationId: string
  ): Promise<IMembership[] | []> {
    return await this.directRepository.findBy({ organizationId });
  }

  async findByUserAndOrganization(
    userId: string,
    organizationId: string
  ): Promise<IMembership | null> {
    return await this.directRepository.findOneBy({ userId, organizationId });
  }

  async findById(id: string): Promise<IMembership | null> {
    return await this.directRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<IMembership[]> {
    return await this.directRepository.find();
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
