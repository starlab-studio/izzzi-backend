export enum NotificationStatus {
  PENDING = "pending",
  FAILED = "failed",
  DELIVERED = "delivered",
  SCHEDULED = "scheduled",
  PROCESSING = "processing",
}

export enum NotificationMode {
  SMS = "sms",
  EMAIL = "email",
  PUSH = "push",
}

export interface INotification {
  id: string;
  sender: string;
  mode: NotificationMode;
  name?: string;
  target: string;
  subject?: string;
  template?: string;
  message?: string;
  status: NotificationStatus;
  retryCount: number;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ICreateNotification = Omit<
  INotification,
  "id" | "status" | "retryCount" | "createdAt" | "updatedAt"
>;

export interface INotificationAttempt {
  id: string;
  notificationId: string;
  attemptNumber: number;
  status: NotificationStatus;
  errorMessage?: string;
  responseCode?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationQueue {
  id: string;
  notificationId: string;
  priority: "low" | "normal" | "high";
  scheduledFor?: Date;
  nextRetryAt?: Date;
  maxRetries: number;
  currentAttempt: number;
  status: NotificationStatus;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}
