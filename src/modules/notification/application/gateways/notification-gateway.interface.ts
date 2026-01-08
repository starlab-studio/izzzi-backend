import { INotification } from "../../domain/notification.types";

export interface INotificationGateway {
  emitToUser(userId: string, notification: INotification): Promise<void>;
}
