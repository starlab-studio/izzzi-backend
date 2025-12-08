import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { MembershipModel } from "../models/membership.model";
import { OrganizationModel } from "../models/organization.model";
import { MembershipEntity } from "../../domain/entities/membership.entity";
import { OrganizationEntity } from "../../domain/entities/organization.entity";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";
import { type IUnitOfWork, BaseTransactionalRepository } from "src/core";
import { MembershipStatus } from "../../domain/types";

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
    const data = entity.toPersistence();
    const ormEntity = repository.create(data);
    const saved = await repository.save(ormEntity);
    return this.toEntity(saved)!;
  }

  async findByOrganization(
    organizationId: string
  ): Promise<MembershipEntity[] | []> {
    const ormEntities = await this.directRepository.findBy({ organizationId });
    return this.toEntities(ormEntities);
  }

  async findByUserIdWithOrganizations(
    userId: string
  ): Promise<MembershipEntity[]> {
    const memberships = await this.directRepository.find({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
      },
      relations: ["organization"],
      order: {
        createdAt: "ASC",
      },
    });

    return this.toEntitiesWithOrganizations(memberships);
  }

  async findActiveByUserId(userId: string): Promise<MembershipEntity[]> {
    const memberships = await this.directRepository.find({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
      },
    });

    return this.toEntities(memberships);
  }

  async findByUserAndOrganization(
    userId: string,
    organizationId: string
  ): Promise<MembershipEntity | null> {
    const ormEntity = await this.directRepository.findOne({
      where: { userId, organizationId },
      relations: ["organization"],
    });

    return this.toEntityWithOrganization(ormEntity);
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
    const data = entity.toPersistence();
    const ormEntity = await repository.save(data);
    return this.toEntity(ormEntity)!;
  }

  async delete(id: string): Promise<void> {
    const repository = this.getTypeOrmRepository();
    await repository.delete(id);
  }

  private toEntity(model: MembershipModel | null): MembershipEntity | null {
    if (!model) return null;

    return MembershipEntity.reconstitute({
      id: model.id,
      userId: model.userId,
      organizationId: model.organizationId,
      role: model.role,
      addedBy: model.addedBy,
      status: model.status,
      leftAt: model.leftAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  private toEntities(models: MembershipModel[]): MembershipEntity[] {
    return models.map((m) => this.toEntity(m)!);
  }

  private toEntityWithOrganization(
    model: MembershipModel | null
  ): MembershipEntity | null {
    if (!model) return null;

    return MembershipEntity.reconstitute({
      id: model.id,
      userId: model.userId,
      organizationId: model.organizationId,
      role: model.role,
      addedBy: model.addedBy,
      status: model.status,
      leftAt: model.leftAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      ...(model.organization && {
        organization: this.toOrganizationEntity(model.organization),
      }),
    });
  }

  private toEntitiesWithOrganizations(
    models: MembershipModel[]
  ): MembershipEntity[] {
    return models.map((model) => {
      return MembershipEntity.reconstitute({
        id: model.id,
        userId: model.userId,
        organizationId: model.organizationId,
        role: model.role,
        addedBy: model.addedBy,
        status: model.status,
        leftAt: model.leftAt,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        ...(model.organization && {
          organization: this.toOrganizationEntity(model.organization),
        }),
      });
    });
  }

  private toOrganizationEntity(model: OrganizationModel): OrganizationEntity {
    return OrganizationEntity.reconstitute({
      id: model.id,
      name: model.name,
      siren: model.siren,
      siret: model.siret,
      vatNumber: model.vatNumber,
      slug: model.slug,
      ownerId: model.ownerId,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
