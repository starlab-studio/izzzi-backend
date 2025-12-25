export type WebhookEventType =
  | "invoice.paid"
  | "payment_intent.succeeded"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | string;

export interface IWebhookEvent {
  readonly id: string;
  readonly type: WebhookEventType;
  readonly data: IWebhookEventData;
}

export interface IWebhookEventData {
  readonly object: IWebhookEventObject;
}

export type IWebhookEventObject =
  | IWebhookInvoice
  | IWebhookPaymentIntent
  | IWebhookSubscription;

export interface IWebhookInvoice {
  readonly id: string;
  readonly subscription?: string | { id: string };
  readonly metadata?: {
    subscriptionId?: string;
    [key: string]: string | undefined;
  };
}

export interface IWebhookPaymentIntent {
  readonly id: string;
  readonly invoice?: string | { id: string };
  readonly metadata?: {
    subscriptionId?: string;
    [key: string]: string | undefined;
  };
}

export interface IWebhookSubscription {
  readonly id: string;
  readonly status?: string;
  readonly metadata?: {
    [key: string]: string | undefined;
  };
}
