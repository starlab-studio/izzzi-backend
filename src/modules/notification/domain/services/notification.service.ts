import { DomainError, ErrorCode } from "src/core";
import { ICreateNotification, NotificationMode } from "../notification.types";

export class NotificationDomainService {
  validateNotification(notification: ICreateNotification) {
    if (notification.mode == NotificationMode.EMAIL) {
      this.validateEmailNotification(notification);
    } else if (notification.mode == NotificationMode.SMS) {
      this.validateSmsNotification(notification);
    } else if (notification.mode == NotificationMode.PUSH) {
      this.validatePushNotification(notification);
    }
  }

  validateEmailNotification(notification: ICreateNotification) {
    if (!notification.name || !notification.subject || !notification.template) {
      throw new DomainError(
        ErrorCode.INVALID_EMAIL_NOTIFICATION_DATA,
        "Name, subject and template are required for email notification"
      );
    }
  }

  validateSmsNotification(notification: ICreateNotification) {
    if (!notification.message) {
      throw new DomainError(
        ErrorCode.INVALID_SMS_NOTIFICATION_DATA,
        "Message is required for sms notification"
      );
    }
  }

  validatePushNotification(notification: ICreateNotification) {
    if (!notification.message) {
      throw new DomainError(
        ErrorCode.INVALID_PUSH_NOTIFICATION_DATA,
        "Message is required for push notification"
      );
    }
  }
}
