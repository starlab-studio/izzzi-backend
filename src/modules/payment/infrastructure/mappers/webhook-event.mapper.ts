import type Stripe from "stripe";
import type {
  IWebhookEvent,
  IWebhookInvoice,
  IWebhookPaymentIntent,
  IWebhookSubscription,
} from "../../domain/types/webhook-event.types";

export class WebhookEventMapper {
  static toDomainEvent(stripeEvent: Stripe.Event): IWebhookEvent {
    return {
      id: stripeEvent.id,
      type: stripeEvent.type,
      data: {
        object: this.toDomainEventObject(stripeEvent),
      },
    };
  }

  private static toDomainEventObject(
    stripeEvent: Stripe.Event
  ): IWebhookInvoice | IWebhookPaymentIntent | IWebhookSubscription {
    const object = stripeEvent.data.object;

    switch (stripeEvent.type) {
      case "invoice.paid":
        return this.toDomainInvoice(object as Stripe.Invoice);

      case "payment_intent.succeeded":
        return this.toDomainPaymentIntent(object as Stripe.PaymentIntent);

      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        return this.toDomainSubscription(object as Stripe.Subscription);

      default:
        return {
          id: (object as any).id || "",
          metadata: (object as any).metadata || {},
        } as IWebhookSubscription;
    }
  }

  private static toDomainInvoice(
    stripeInvoice: Stripe.Invoice
  ): IWebhookInvoice {
    return {
      id: stripeInvoice.id,
      subscription:
        typeof stripeInvoice.subscription === "string"
          ? stripeInvoice.subscription
          : stripeInvoice.subscription
            ? { id: stripeInvoice.subscription.id }
            : undefined,
      metadata: stripeInvoice.metadata || {},
    };
  }

  private static toDomainPaymentIntent(
    stripePaymentIntent: Stripe.PaymentIntent
  ): IWebhookPaymentIntent {
    return {
      id: stripePaymentIntent.id,
      invoice:
        typeof stripePaymentIntent.invoice === "string"
          ? stripePaymentIntent.invoice
          : stripePaymentIntent.invoice
            ? { id: stripePaymentIntent.invoice.id }
            : undefined,
      metadata: stripePaymentIntent.metadata || {},
    };
  }

  private static toDomainSubscription(
    stripeSubscription: Stripe.Subscription
  ): IWebhookSubscription {
    return {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      metadata: stripeSubscription.metadata || {},
    };
  }
}
