import { MoreThan, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { InvitationEntity } from "../../domain/entities/invitation.entity";
import { InvitationModel } from "../models/invitation.model";
import { type IUnitOfWork, BaseTransactionalRepository } from "src/core";
import { IInvitationRepository } from "../../domain/repositories/invitation.repository";
import { InvitationStatus } from "../../domain/types";

export class InvitationRepository
  extends BaseTransactionalRepository<InvitationEntity>
  implements IInvitationRepository
{
  constructor(
    @InjectRepository(InvitationModel)
    private readonly directRepository: Repository<InvitationModel>,
    unitOfWork: IUnitOfWork
  ) {
    super(unitOfWork);
  }

  private getTypeOrmRepository(): Repository<InvitationModel> {
    const typeOrmUow = this.unitOfWork as any;
    return typeOrmUow.getEntityManager().getRepository(InvitationModel);
  }

  async create(entity: InvitationEntity): Promise<InvitationEntity> {
    const data = entity.toPersistance();
    const ormEntity = this.directRepository.create(data);
    const saved = await this.directRepository.save(ormEntity);
    return InvitationEntity.reconstitute(saved);
  }

  async findById(id: string): Promise<InvitationEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    return this.toEntity(ormEntity);
  }

  async findByEmail(email: string): Promise<InvitationEntity[]> {
    const normalizedEmail = email.trim().toLowerCase();
    const ormEntities = await this.directRepository.findBy({ email: normalizedEmail });
    return this.toEntities(ormEntities);
  }

  async findByInviter(inviterId: string): Promise<InvitationEntity[] | []> {
    const ormEntities = await this.directRepository.findBy({
      invitedBy: inviterId,
    });
    return this.toEntities(ormEntities);
  }

  async findByInviterAndOrganization(
    inviterId: string,
    organizationId: string
  ): Promise<InvitationEntity[] | []> {
    const ormEntities = await this.directRepository.findBy({
      invitedBy: inviterId,
      organizationId,
    });

    return this.toEntities(ormEntities);
  }

  async findPendingByEmailAndOrg(
    email: string,
    organizationId: string
  ): Promise<InvitationEntity | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const ormEntity = await this.directRepository.findOne({
      where: {
        email: normalizedEmail,
        organizationId,
        status: InvitationStatus.PENDING,
        expiresAt: MoreThan(new Date()),
      },
    });
    return this.toEntity(ormEntity);
  }

  async findByOrganization(
    organizationId: string
  ): Promise<InvitationEntity[] | []> {
    const ormEntities = await this.directRepository.findBy({ organizationId });
    return this.toEntities(ormEntities);
  }

  async findByToken(token: string): Promise<InvitationEntity | null> {
    const ormEntity = await this.directRepository.findOneBy({ token });
    return this.toEntity(ormEntity);
  }

  async findAll(): Promise<InvitationEntity[]> {
    const ormEntities = await this.directRepository.find();
    return this.toEntities(ormEntities);
  }

  async save(entity: InvitationEntity): Promise<InvitationEntity> {
    const repository = this.getTypeOrmRepository();
    const data = entity.toPersistance();
    const ormEntity = await repository.save(data);
    return InvitationEntity.reconstitute(ormEntity);
  }

  async delete(id: string): Promise<void> {
    await this.directRepository.delete(id);
  }

  private toEntity(model: InvitationModel | null): InvitationEntity | null {
    return model ? InvitationEntity.reconstitute(model) : null;
  }

  private toEntities(models: InvitationModel[]): InvitationEntity[] {
    return models.map((m) => InvitationEntity.reconstitute(m));
  }
}
