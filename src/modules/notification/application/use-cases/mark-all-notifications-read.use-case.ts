import { BaseUseCase, IUseCase, ILoggerService } from "src/core";
import { INotificationRespository } from "../../domain/repositories/notification.repository";
import { NotificationMode } from "../../domain/notification.types";

export interface MarkAllNotificationsReadInput {
  userId: string;
}

export interface MarkAllNotificationsReadOutput {
  success: boolean;
  message: string;
  updatedCount: number;
}

export class MarkAllNotificationsReadUseCase
  extends BaseUseCase
  implements
    IUseCase<MarkAllNotificationsReadInput, MarkAllNotificationsReadOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly notificationRepository: INotificationRespository,
  ) {
    super(logger);
  }

  async execute(
    data: MarkAllNotificationsReadInput,
  ): Promise<MarkAllNotificationsReadOutput> {
    try {
      this.logger.info(
        `Marking all notifications as read for user ${data.userId}`,
      );

      const notifications = await this.notificationRepository.findByTarget(
        data.userId,
        NotificationMode.PUSH,
      );

      const unreadNotifications = notifications.filter((n) => !n.isRead);

      const updatePromises = unreadNotifications.map((notification) =>
        this.notificationRepository.update(notification.id, { isRead: true }),
      );

      await Promise.all(updatePromises);

      this.logger.info(
        `Marked ${unreadNotifications.length} notifications as read for user ${data.userId}`,
      );

      return {
        success: true,
        message: `Marked ${unreadNotifications.length} notification(s) as read`,
        updatedCount: unreadNotifications.length,
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async withCompensation(
    _input: MarkAllNotificationsReadInput,
  ): Promise<void> {}
}
