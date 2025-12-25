import Stripe from "stripe";
import { SubscriptionPlanEntity } from "src/modules/subscription/domain/entities/subscription-plan.entity";
import { PricingTierEntity } from "src/modules/subscription/domain/entities/pricing-tier.entity";

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
    status: Stripe.Subscription.Status;
  }>;

  updateSubscriptionQuantity(
    subscriptionId: string,
    newQuantity: number,
    newPriceId?: string,
    options?: {
      prorationBehavior?: Stripe.SubscriptionUpdateParams.ProrationBehavior;
    }
  ): Promise<Stripe.Subscription>;

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

  getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null>;

  getInvoice(invoiceId: string): Promise<Stripe.Invoice | null>;

  getPaymentMethod(
    paymentMethodId: string
  ): Promise<Stripe.PaymentMethod | null>;

  createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<string>;

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event;

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
