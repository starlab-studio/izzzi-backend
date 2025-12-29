import Stripe from "stripe";
import type {
  StripeSubscription,
  StripeInvoice,
  StripePaymentMethod,
  StripeEvent,
  StripePrice,
  StripeSubscriptionStatus,
} from "../../domain/types/stripe.types";

export class StripeDomainMapper {
  static toDomainSubscription(
    stripeSubscription: Stripe.Subscription
  ): StripeSubscription {
    return {
      id: stripeSubscription.id,
      status: stripeSubscription.status as StripeSubscriptionStatus,
      customer:
        typeof stripeSubscription.customer === "string"
          ? stripeSubscription.customer
          : { id: stripeSubscription.customer.id },
      current_period_start: stripeSubscription.current_period_start,
      current_period_end: stripeSubscription.current_period_end,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      canceled_at: stripeSubscription.canceled_at || null,
      items: {
        data: stripeSubscription.items.data.map((item) => ({
          price: {
            id: item.price.id,
            unit_amount: item.price.unit_amount,
          },
          quantity: item.quantity || null,
        })),
      },
      latest_invoice:
        typeof stripeSubscription.latest_invoice === "string"
          ? stripeSubscription.latest_invoice
          : stripeSubscription.latest_invoice
            ? this.toDomainInvoice(stripeSubscription.latest_invoice)
            : null,
      default_payment_method:
        typeof stripeSubscription.default_payment_method === "string"
          ? stripeSubscription.default_payment_method
          : stripeSubscription.default_payment_method
            ? this.toDomainPaymentMethod(
                stripeSubscription.default_payment_method
              )
            : null,
      metadata: stripeSubscription.metadata,
    };
  }

  static toDomainInvoice(stripeInvoice: Stripe.Invoice): StripeInvoice {
    return {
      id: stripeInvoice.id,
      status: stripeInvoice.status as
        | "draft"
        | "open"
        | "paid"
        | "void"
        | "uncollectible",
      customer:
        typeof stripeInvoice.customer === "string"
          ? stripeInvoice.customer
          : { id: stripeInvoice.customer?.id || "" },
      subscription:
        typeof stripeInvoice.subscription === "string"
          ? stripeInvoice.subscription
          : stripeInvoice.subscription
            ? {
                id: stripeInvoice.subscription.id,
                status: stripeInvoice.subscription
                  .status as StripeSubscriptionStatus,
                customer:
                  typeof stripeInvoice.subscription.customer === "string"
                    ? stripeInvoice.subscription.customer
                    : { id: stripeInvoice.subscription.customer.id },
                current_period_start:
                  stripeInvoice.subscription.current_period_start,
                current_period_end:
                  stripeInvoice.subscription.current_period_end,
                cancel_at_period_end:
                  stripeInvoice.subscription.cancel_at_period_end,
                canceled_at: stripeInvoice.subscription.canceled_at || null,
                items: {
                  data: stripeInvoice.subscription.items.data.map((item) => ({
                    price: {
                      id: item.price.id,
                      unit_amount: item.price.unit_amount,
                    },
                    quantity: item.quantity || null,
                  })),
                },
                metadata: stripeInvoice.subscription.metadata,
              }
            : null,
      amount_due: stripeInvoice.amount_due,
      amount_paid: stripeInvoice.amount_paid,
      currency: stripeInvoice.currency,
      invoice_pdf: stripeInvoice.invoice_pdf || null,
      hosted_invoice_url: stripeInvoice.hosted_invoice_url || null,
      created: stripeInvoice.created,
      paid: stripeInvoice.status_transitions?.paid_at
        ? Math.floor(stripeInvoice.status_transitions.paid_at * 1000)
        : null,
      metadata: stripeInvoice.metadata
        ? (stripeInvoice.metadata as Record<string, string>)
        : undefined,
      payment_intent:
        typeof stripeInvoice.payment_intent === "string"
          ? stripeInvoice.payment_intent
          : stripeInvoice.payment_intent
            ? {
                id: stripeInvoice.payment_intent.id,
                client_secret: stripeInvoice.payment_intent.client_secret,
                payment_method:
                  typeof stripeInvoice.payment_intent.payment_method ===
                  "string"
                    ? stripeInvoice.payment_intent.payment_method
                    : stripeInvoice.payment_intent.payment_method
                      ? this.toDomainPaymentMethod(
                          stripeInvoice.payment_intent.payment_method
                        )
                      : null,
              }
            : null,
    };
  }

  static toDomainPaymentMethod(
    stripePaymentMethod: Stripe.PaymentMethod
  ): StripePaymentMethod {
    return {
      id: stripePaymentMethod.id,
      type: stripePaymentMethod.type,
      customer:
        typeof stripePaymentMethod.customer === "string"
          ? stripePaymentMethod.customer
          : null,
      card: stripePaymentMethod.card
        ? {
            brand: stripePaymentMethod.card.brand,
            last4: stripePaymentMethod.card.last4,
            exp_month: stripePaymentMethod.card.exp_month,
            exp_year: stripePaymentMethod.card.exp_year,
          }
        : undefined,
    };
  }

  static toDomainEvent(stripeEvent: Stripe.Event): StripeEvent {
    return {
      id: stripeEvent.id,
      type: stripeEvent.type,
      data: {
        object: stripeEvent.data.object,
      },
    };
  }

  static toDomainPrice(stripePrice: Stripe.Price): StripePrice {
    return {
      id: stripePrice.id,
      unit_amount: stripePrice.unit_amount,
      currency: stripePrice.currency,
      recurring: stripePrice.recurring
        ? {
            interval: stripePrice.recurring.interval as "month" | "year",
          }
        : undefined,
    };
  }
}
