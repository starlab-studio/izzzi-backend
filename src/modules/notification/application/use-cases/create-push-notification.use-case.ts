import { INotificationRespository } from "../../domain/repositories/notification.repository";
import {
  ICreateNotification,
  INotification,
  NotificationMode,
  NotificationStatus,
} from "../../domain/notification.types";
import { NotificationDomainService } from "../../domain/services/notification.service";
import { Notification } from "../../domain/entities/notification.entity";

export class CreatePushNotificationUseCase {
  constructor(
    private readonly notificationDomainService: NotificationDomainService,
    private readonly notificationRepository: INotificationRespository
  ) {}

  async execute(
    data: Omit<
      ICreateNotification,
      "sender" | "mode" | "deliveredAt" | "template" | "subject"
    >
  ): Promise<INotification> {
    try {
      const sender = "system";
      const mode = NotificationMode.PUSH;

      this.notificationDomainService.validateNotification({
        ...data,
        sender,
        mode,
      });

      const notification = new Notification({
        ...data,
        sender,
        mode,
        status: NotificationStatus.DELIVERED,
        retryCount: 0,
        isRead: false,
      });

      const ormNotification =
        await this.notificationRepository.create(notification);

      // Pour les notifications push, on ne fait pas d'appel à un provider externe
      // La notification est simplement créée en base et sera récupérée par le frontend
      // TODO : implémenter un websocket pour l'envoie vers le frontend

      return ormNotification;
    } catch (error) {
      throw error;
    }
  }
}
