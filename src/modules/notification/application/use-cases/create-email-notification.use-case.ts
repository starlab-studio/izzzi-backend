import { INotificationRespository } from "../../domain/repositories/notification.repository";
import {
  ICreateNotification,
  INotification,
  NotificationMode,
  NotificationStatus,
} from "../../domain/notification.types";
import { NotificationDomainService } from "../../domain/services/notification.service";
import { INotificationProvider } from "../providers/notification.provider";
import { Notification } from "../../domain/entities/notification.entity";

export class CreateEmailNotificationUseCase {
  constructor(
    private readonly notificationDomainService: NotificationDomainService,
    private readonly notificationRepository: INotificationRespository,
    private readonly notificationProvider: INotificationProvider
  ) {}

  async execute(
    data: Omit<
      ICreateNotification,
      "sender" | "mode" | "deliveredAt" | "message"
    >
  ): Promise<INotification> {
    try {
      const name = "Izzzi";
      const sender = "ddaniomer95@gmail.com"; // TODO: DEFINE GLOBALLY AND ENABLE ACCESS FROM config
      const mode = NotificationMode.EMAIL;
      this.notificationDomainService.validateNotification({
        ...data,
        name,
        sender,
        mode,
      });
      const notification = new Notification({
        ...data,
        name,
        sender,
        mode,
        status: NotificationStatus.PENDING,
        retryCount: 0,
      });
      const ormNotification =
        await this.notificationRepository.create(notification);
      await this.notificationProvider.send(ormNotification);
      await this.notificationRepository.update(ormNotification.id, {
        status: NotificationStatus.DELIVERED,
        deliveredAt: new Date(),
      });
      return ormNotification;
    } catch (error) {
      throw error;
    }
  }
}
