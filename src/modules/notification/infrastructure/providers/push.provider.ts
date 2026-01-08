import { Inject, Injectable } from "@nestjs/common";
import { INotification } from "../../domain/notification.types";
import { INotificationProvider } from "../../application/providers/notification.provider";
import { type INotificationGateway } from "../../application/gateways/notification-gateway.interface";

@Injectable()
export class PushProvider implements INotificationProvider {
  constructor(
    @Inject("NOTIFICATION_GATEWAY")
    private readonly notificationGateway: INotificationGateway,
  ) {}

  async send(notification: INotification): Promise<void> {
    await this.notificationGateway.emitToUser(
      notification.target,
      notification,
    );
  }
}
