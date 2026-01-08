export type StripeSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | "paused_incomplete";

export type StripeProrationBehavior =
  | "create_prorations"
  | "none"
  | "always_invoice";

export interface StripeSubscription {
  id: string;
  status: StripeSubscriptionStatus;
  customer: string | { id: string };
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number | null;
      };
      quantity: number | null;
    }>;
  };
  latest_invoice?: string | StripeInvoice | null;
  default_payment_method?: string | StripePaymentMethod | null;
  metadata?: Record<string, string>;
}

export interface StripeInvoice {
  id: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  customer: string | { id: string };
  subscription: string | StripeSubscription | null;
  amount_due: number;
  amount_paid: number;
  currency: string;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  created: number;
  paid: number | null;
  metadata?: Record<string, string>;
  payment_intent?:
    | string
    | {
        id: string;
        client_secret: string | null;
        payment_method?: string | StripePaymentMethod | null;
      }
    | null;

  lines?: {
    data: Array<{
      metadata?: Record<string, string>;
    }>;
  };
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  customer: string | null;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: unknown;
  };
}

export interface StripePrice {
  id: string;
  unit_amount: number | null;
  currency: string;
  recurring?: {
    interval: "month" | "year";
  };
}
