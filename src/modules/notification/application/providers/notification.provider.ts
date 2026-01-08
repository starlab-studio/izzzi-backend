import { INotification } from "../../domain/notification.types";

export interface INotificationProvider {
  send(notification: INotification): Promise<void>;
}
