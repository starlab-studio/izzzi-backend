import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import {
  ICreateNotification,
  INotification,
} from "../../domain/notification.types";
import { NotificationModel } from "../models/notification.model";
import { INotificationRespository } from "../../domain/repositories/notification.repository";

export class NotificationRepository implements INotificationRespository {
  constructor(
    @InjectRepository(NotificationModel)
    private ormRepository: Repository<NotificationModel>,
  ) {}

  async findById(id: string): Promise<INotification | null> {
    return await this.ormRepository.findOne({ where: { id } });
  }

  async create(entity: ICreateNotification): Promise<INotification> {
    const repository = this.ormRepository.create(entity);
    return this.ormRepository.save(repository);
  }

  async update(
    id: string,
    entity: Partial<INotification>,
  ): Promise<INotification> {
    await this.ormRepository.update(id, entity);
    return (await this.findById(id)) as INotification;
  }

  async findByTarget(userId: string, mode?: string): Promise<INotification[]> {
    const where: any = { target: userId };
    if (mode) {
      where.mode = mode;
    }
    return await this.ormRepository.find({
      where,
      order: { createdAt: "DESC" },
    });
  }
}
