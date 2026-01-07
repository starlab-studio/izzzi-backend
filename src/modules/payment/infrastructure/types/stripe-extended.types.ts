import type Stripe from "stripe";

/**
 * Extended types for Stripe objects to handle expandable properties
 * These types are needed because Stripe's TypeScript types may not expose
 * all properties when they are expandable (can be string ID or full object)
 */

/**
 * Invoice with expanded subscription and payment_intent
 */
export type ExpandedInvoice = Omit<
  Stripe.Invoice,
  "subscription" | "payment_intent"
> & {
  subscription?: string | ExpandedSubscription | null;
  payment_intent?: string | ExpandedPaymentIntent | null;
};

/**
 * Subscription with all period properties
 */
export type ExpandedSubscription = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};

/**
 * PaymentIntent with expanded invoice
 */
export type ExpandedPaymentIntent = Omit<Stripe.PaymentIntent, "invoice"> & {
  invoice?: string | Stripe.Invoice | null;
};

/**
 * InvoiceLineItem with proration property
 */
export type ExpandedInvoiceLineItem = Stripe.InvoiceLineItem & {
  proration?: boolean | null;
};

/**
 * Helper type guards
 */
export function isExpandedSubscription(
  subscription: string | ExpandedSubscription | null | undefined
): subscription is ExpandedSubscription {
  return (
    subscription !== null &&
    subscription !== undefined &&
    typeof subscription === "object" &&
    "id" in subscription
  );
}

export function isExpandedPaymentIntent(
  paymentIntent: string | ExpandedPaymentIntent | null | undefined
): paymentIntent is ExpandedPaymentIntent {
  return (
    paymentIntent !== null &&
    paymentIntent !== undefined &&
    typeof paymentIntent === "object" &&
    "id" in paymentIntent
  );
}

export function isExpandedInvoice(
  invoice: string | Stripe.Invoice | null | undefined
): invoice is Stripe.Invoice {
  return (
    invoice !== null &&
    invoice !== undefined &&
    typeof invoice === "object" &&
    "id" in invoice
  );
}
