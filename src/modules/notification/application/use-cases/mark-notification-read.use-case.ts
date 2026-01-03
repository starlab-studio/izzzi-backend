import { BaseUseCase, IUseCase, ILoggerService } from "src/core";
import { INotificationRespository } from "../../domain/repositories/notification.repository";

export interface MarkNotificationReadInput {
  notificationId: string;
  userId: string;
  isRead: boolean;
}

export interface MarkNotificationReadOutput {
  success: boolean;
  message: string;
}

export class MarkNotificationReadUseCase
  extends BaseUseCase
  implements IUseCase<MarkNotificationReadInput, MarkNotificationReadOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly notificationRepository: INotificationRespository
  ) {
    super(logger);
  }

  async execute(
    data: MarkNotificationReadInput
  ): Promise<MarkNotificationReadOutput> {
    try {
      this.logger.info(
        `Marking notification ${data.notificationId} as ${data.isRead ? "read" : "unread"} for user ${data.userId}`
      );

      const notification = await this.notificationRepository.findById(
        data.notificationId
      );

      if (!notification) {
        throw new Error("Notification not found");
      }

      if (notification.target !== data.userId) {
        throw new Error("Unauthorized: Notification does not belong to user");
      }

      await this.notificationRepository.update(data.notificationId, {
        isRead: data.isRead,
      });

      this.logger.info(
        `Notification ${data.notificationId} marked as ${data.isRead ? "read" : "unread"}`
      );

      return {
        success: true,
        message: `Notification marked as ${data.isRead ? "read" : "unread"}`,
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async withCompensation(input: MarkNotificationReadInput): Promise<void> {}
}
