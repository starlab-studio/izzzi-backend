import {
  INotification,
  NotificationMode,
  NotificationStatus,
} from "../notification.types";

export class Notification implements INotification {
  public readonly id!: string;
  public sender: string;
  public mode: NotificationMode;
  public name?: string;
  public target: string;
  public subject?: string | undefined;
  public template?: string;
  public message?: string | undefined;
  public status: NotificationStatus;
  public retryCount: number;
  public deliveredAt?: Date | undefined;
  public createdAt!: Date;
  public updatedAt!: Date;

  constructor(data: Omit<INotification, "id" | "createdAt" | "updatedAt">) {
    this.sender = data.sender;
    this.mode = data.mode;
    this.name = data.name;
    this.target = data.target;
    this.subject = data.subject;
    this.template = data.template;
    this.message = data.message;
    this.status = data.status;
    this.retryCount = data.retryCount;
    this.deliveredAt = data.deliveredAt;
  }
}
