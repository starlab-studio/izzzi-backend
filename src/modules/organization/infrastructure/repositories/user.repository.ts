import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { UserModel } from "../models/user.model";
import { UserEntity } from "../../domain/entities/user.entity";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { type IUnitOfWork, BaseTransactionalRepository } from "src/core";
import { MembershipStatus } from "../../domain/types";
import { MembershipModel } from "../models/membership.model";
import { MembershipEntity } from "../../domain/entities/membership.entity";
import { OrganizationEntity } from "../../domain/entities/organization.entity";

export class UserRepository
  extends BaseTransactionalRepository<UserEntity>
  implements IUserRepository
{
  constructor(
    @InjectRepository(UserModel)
    private readonly directRepository: Repository<UserModel>,
    readonly unitOfWork: IUnitOfWork
  ) {
    super(unitOfWork);
  }

  private getTypeOrmRepository(): Repository<UserModel> {
    try {
      const typeOrmUow = this.unitOfWork as any;
      const entityManager = typeOrmUow.getEntityManager();
      return entityManager.getRepository(UserModel);
    } catch {
      return this.directRepository;
    }
  }

  async create(entity: UserEntity): Promise<UserEntity> {
    const repository = this.getTypeOrmRepository();
    const data = entity.toPersistence();
    const ormEntity = repository.create(data);
    const saved = await repository.save(ormEntity);
    return UserEntity.reconstitute({ ...saved, memberships: [] });
  }

  async findById(id: string): Promise<UserEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    return this.toEntity(ormEntity, []);
  }

  async findByIdWithActiveMemberships(
    userId: string
  ): Promise<UserEntity | null> {
    const ormEntity = await this.directRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect(
        "user.memberships",
        "membership",
        "membership.status = :status",
        { status: MembershipStatus.ACTIVE }
      )
      .leftJoinAndSelect("membership.organization", "organization")
      .where("user.id = :userId", { userId })
      .getOne();

    if (!ormEntity) return null;

    const memberships = this.toMembershipEntities(ormEntity.memberships || []);
    return this.toEntity(ormEntity, memberships);
  }

  async findByEmailWithMemberships(email: string): Promise<UserEntity | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const ormEntity = await this.directRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.memberships", "membership")
      .leftJoinAndSelect("membership.organization", "organization")
      .where("user.email = :email", { email: normalizedEmail })
      .getOne();

    if (!ormEntity) return null;

    const memberships = this.toMembershipEntities(ormEntity.memberships || []);
    return this.toEntity(ormEntity, memberships);
  }

  async findByEmailWithActiveMemberships(
    email: string
  ): Promise<UserEntity | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const ormEntity = await this.directRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect(
        "user.memberships",
        "membership",
        "membership.status = :status",
        { status: MembershipStatus.ACTIVE }
      )
      .leftJoinAndSelect("membership.organization", "organization")
      .where("user.email = :email", { email: normalizedEmail })
      .getOne();

    if (!ormEntity) return null;

    const memberships = this.toMembershipEntities(ormEntity.memberships || []);
    return this.toEntity(ormEntity, memberships);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const ormEntity = await this.directRepository.findOne({
      where: { email: normalizedEmail },
    });
    return this.toEntity(ormEntity, []);
  }

  async findAll(): Promise<UserEntity[]> {
    const ormEntities = await this.directRepository.find();
    return this.toEntities(ormEntities, []);
  }

  async save(entity: UserEntity): Promise<UserEntity> {
    const repository = this.getTypeOrmRepository();
    const data = entity.toPersistence();
    // Exclude memberships to avoid TypeORM trying to save relations
    const saved = await repository.save({
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      avatarUrl: data.avatarUrl,
      lastLogin: data.lastLogin,
      status: data.status,
      role: data.role,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
    // Exclude memberships from reconstitute to avoid type mismatch
    const { memberships: _memberships, ...userWithoutMemberships } = saved;
    return UserEntity.reconstitute({
      ...userWithoutMemberships,
      memberships: [],
    });
  }

  async delete(id: string): Promise<void> {
    const repository = this.getTypeOrmRepository();
    await repository.delete(id);
  }

  private toEntity(
    model: UserModel | null,
    memberships: MembershipEntity[]
  ): UserEntity | null {
    if (!model) return null;

    return UserEntity.reconstitute({
      id: model.id,
      firstName: model.firstName,
      lastName: model.lastName,
      email: model.email,
      phoneNumber: model.phoneNumber,
      avatarUrl: model.avatarUrl,
      lastLogin: model.lastLogin,
      status: model.status,
      role: model.role,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      memberships: memberships,
    });
  }

  private toEntities(
    models: UserModel[],
    memberships: MembershipEntity[]
  ): UserEntity[] {
    return models
      .map((m) => this.toEntity(m, memberships))
      .filter((entity): entity is UserEntity => entity !== null);
  }

  private toMembershipEntities(models: MembershipModel[]): MembershipEntity[] {
    return models.map((m) => {
      const organization = m.organization
        ? OrganizationEntity.reconstitute(m.organization)
        : undefined;

      return MembershipEntity.reconstitute({
        id: m.id,
        userId: m.userId,
        organizationId: m.organizationId,
        role: m.role,
        status: m.status,
        addedBy: m.addedBy,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        leftAt: m.leftAt,
        organization,
      });
    });
  }
}
