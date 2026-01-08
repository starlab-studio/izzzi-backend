import { SubscriptionPlanEntity } from "src/modules/subscription/domain/entities/subscription-plan.entity";
import { PricingTierEntity } from "src/modules/subscription/domain/entities/pricing-tier.entity";
import type {
  StripeSubscription,
  StripeSubscriptionStatus,
  StripeInvoice,
  StripePaymentMethod,
  StripeProrationBehavior,
  StripePrice,
} from "../types/stripe.types";

export interface IStripeSyncService {
  syncPlanToStripe(plan: SubscriptionPlanEntity): Promise<string>;

  syncPricingTiersToStripe(
    productId: string,
    tiers: PricingTierEntity[]
  ): Promise<Map<string, string>>;

  getOrCreateCustomer(
    organizationId: string,
    email: string,
    name: string
  ): Promise<string>;

  createSubscription(params: {
    customerId: string;
    priceId: string;
    quantity: number;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<{
    subscriptionId: string;
    clientSecret: string | null;
    status: StripeSubscriptionStatus;
  }>;

  updateSubscriptionQuantity(
    subscriptionId: string,
    newQuantity: number,
    newPriceId?: string,
    options?: {
      prorationBehavior?: StripeProrationBehavior;
      billingCycleAnchor?: "now" | "unchanged";
    }
  ): Promise<StripeSubscription>;

  createPaymentIntent(params: {
    customerId: string;
    amountCents: number;
    currency?: string;
    metadata?: Record<string, string>;
    createInvoice?: boolean;
    description?: string;
  }): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    invoiceId?: string;
  }>;

  getSubscription(subscriptionId: string): Promise<StripeSubscription | null>;

  getInvoice(invoiceId: string): Promise<StripeInvoice | null>;

  getPaymentMethod(
    paymentMethodId: string
  ): Promise<StripePaymentMethod | null>;

  getPrice(priceId: string): Promise<StripePrice | null>;

  createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<string>;

  // Note: This method returns Stripe.Event (from the Stripe library) because
  // webhook controllers need the full Stripe event object for processing.
  // The domain StripeEvent type is for internal use in other contexts.
  constructWebhookEvent(payload: Buffer, signature: string): any;

  previewQuantityChange(params: {
    customerId: string;
    subscriptionId: string;
    newQuantity: number;
    newPriceId?: string;
  }): Promise<{
    amountDue: number;
    currency: string;
    prorationAmount: number;
  }>;
}

export const STRIPE_SYNC_SERVICE = Symbol("IStripeSyncService");
