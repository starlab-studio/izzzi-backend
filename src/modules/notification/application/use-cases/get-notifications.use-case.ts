import { BaseUseCase, IUseCase, ILoggerService } from "src/core";
import { INotificationRespository } from "../../domain/repositories/notification.repository";
import { ISubjectRepository } from "src/modules/subject/domain/repositories/subject.repository";
import { NotificationMode } from "../../domain/notification.types";

export interface GetNotificationsInput {
  userId: string;
}

export interface NotificationOutput {
  id: string;
  type: "negative" | "positive";
  courseName: string;
  teacherName: string;
  timestamp: string;
  isRead: boolean;
}

export interface GetNotificationsOutput {
  notifications: NotificationOutput[];
  unreadCount: number;
}

export class GetNotificationsUseCase
  extends BaseUseCase
  implements IUseCase<GetNotificationsInput, GetNotificationsOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly notificationRepository: INotificationRespository,
    private readonly subjectRepository: ISubjectRepository,
  ) {
    super(logger);
  }

  async execute(data: GetNotificationsInput): Promise<GetNotificationsOutput> {
    try {
      this.logger.info(`Fetching notifications for user ${data.userId}`);

      const notifications = await this.notificationRepository.findByTarget(
        data.userId,
        NotificationMode.PUSH,
      );

      const mappedNotifications: NotificationOutput[] = [];

      for (const notification of notifications) {
        try {
          const metadata = notification.metadata || {};
          const subjectId = metadata.subjectId as string | undefined;
          const alertType = metadata.alertType as
            | "negative"
            | "alert"
            | undefined;

          if (!subjectId) {
            this.logger.warn(
              `Notification ${notification.id} missing subjectId metadata`,
            );
            continue;
          }

          const subject = await this.subjectRepository.findById(subjectId);
          if (!subject) {
            this.logger.warn(
              `Subject ${subjectId} not found for notification ${notification.id}`,
            );
            continue;
          }

          const type: "negative" | "positive" =
            alertType === "negative" || alertType === "alert"
              ? "negative"
              : "positive";

          mappedNotifications.push({
            id: notification.id,
            type,
            courseName: subject.name,
            teacherName: subject.instructorName || "N/A",
            timestamp: notification.createdAt.toISOString(),
            isRead: notification.isRead,
          });
        } catch (error) {
          this.logger.error(
            `Error mapping notification ${notification.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
            "get-notification-use-case",
          );
          continue;
        }
      }

      const unreadCount = mappedNotifications.filter((n) => !n.isRead).length;

      this.logger.info(
        `Retrieved ${mappedNotifications.length} notifications for user ${data.userId} (${unreadCount} unread)`,
      );

      return {
        notifications: mappedNotifications,
        unreadCount,
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async withCompensation(_input: GetNotificationsInput): Promise<void> {}
}
