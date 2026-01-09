import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { SubscriptionPlanEntity } from "src/modules/subscription/domain/entities/subscription-plan.entity";
import { PricingTierEntity } from "src/modules/subscription/domain/entities/pricing-tier.entity";
import { IStripeSyncService } from "../../domain/services/stripe-sync.service";
import type {
  StripeSubscription,
  StripeSubscriptionStatus,
  StripeInvoice,
  StripePaymentMethod,
  StripePrice,
} from "../../domain/types/stripe.types";
import { StripeDomainMapper } from "../mappers/stripe-domain.mapper";
import type {
  ExpandedInvoice,
  ExpandedInvoiceLineItem,
} from "../types/stripe-extended.types";
import { isExpandedPaymentIntent } from "../types/stripe-extended.types";

@Injectable()
export class StripeSyncService implements IStripeSyncService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeSyncService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>("stripe.secretKey");
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is required");
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: "2025-12-15.clover",
    });
  }

  async syncPlanToStripe(plan: SubscriptionPlanEntity): Promise<string> {
    const existingProductId = plan.stripeProductId;

    const productData: Stripe.ProductCreateParams = {
      name: plan.name,
      description: plan.priceSubtext || undefined,
      active: plan.isActive,
      metadata: {
        planId: plan.id,
        variant: plan.variant,
        isFree: plan.isFree.toString(),
      },
    };

    if (existingProductId) {
      try {
        const updatedProduct = await this.stripe.products.update(
          existingProductId,
          productData
        );
        this.logger.log(`Updated Stripe product: ${updatedProduct.id}`);
        return updatedProduct.id;
      } catch (error) {
        if (
          error instanceof Stripe.errors.StripeError &&
          error.code === "resource_missing"
        ) {
          this.logger.warn(
            `Product ${existingProductId} not found, creating new one`
          );
          return this.createNewProduct(productData);
        }
        throw error;
      }
    }

    return this.createNewProduct(productData);
  }

  private async createNewProduct(
    productData: Stripe.ProductCreateParams
  ): Promise<string> {
    const product = await this.stripe.products.create(productData);
    this.logger.log(`Created Stripe product: ${product.id}`);
    return product.id;
  }

  async syncPricingTiersToStripe(
    productId: string,
    tiers: PricingTierEntity[]
  ): Promise<Map<string, string>> {
    const tierToPriceIdMap = new Map<string, string>();

    for (const tier of tiers) {
      const existingPriceId = tier.stripePriceId;
      const unitAmount =
        tier.billingPeriod === "annual"
          ? tier.pricePerClassCents * 12
          : tier.pricePerClassCents;

      const interval: Stripe.PriceCreateParams.Recurring.Interval =
        tier.billingPeriod === "monthly" ? "month" : "year";

      const nickname = `${tier.minClasses}-${tier.maxClasses} classes (${tier.billingPeriod})`;

      const priceData: Stripe.PriceCreateParams = {
        product: productId,
        unit_amount: unitAmount,
        currency: "eur",
        nickname,
        recurring: {
          interval,
          usage_type: "licensed",
        },
        metadata: {
          tierId: tier.id,
          planId: tier.planId,
          minClasses: tier.minClasses.toString(),
          maxClasses: tier.maxClasses.toString(),
          pricePerClassCents: tier.pricePerClassCents.toString(),
        },
      };

      if (existingPriceId) {
        try {
          const existingPrice =
            await this.stripe.prices.retrieve(existingPriceId);

          if (existingPrice.unit_amount !== unitAmount) {
            this.logger.warn(
              `Price changed for tier ${tier.id}, creating new price and archiving old one`
            );
            await this.stripe.prices.update(existingPriceId, { active: false });
            const newPrice = await this.stripe.prices.create(priceData);
            tierToPriceIdMap.set(tier.id, newPrice.id);
          } else {
            tierToPriceIdMap.set(tier.id, existingPriceId);
          }
        } catch (error) {
          if (
            error instanceof Stripe.errors.StripeError &&
            error.code === "resource_missing"
          ) {
            const newPrice = await this.stripe.prices.create(priceData);
            tierToPriceIdMap.set(tier.id, newPrice.id);
          } else {
            throw error;
          }
        }
      } else {
        const price = await this.stripe.prices.create(priceData);
        this.logger.log(
          `Created Stripe price: ${price.id} for tier ${tier.id}`
        );
        tierToPriceIdMap.set(tier.id, price.id);
      }
    }

    return tierToPriceIdMap;
  }

  async createCustomer(params: {
    email: string;
    name: string;
    metadata?: Record<string, string>;
  }): Promise<string> {
    const customer = await this.stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata || {},
    });

    this.logger.log(`Created Stripe customer: ${customer.id}`);
    return customer.id;
  }

  async getOrCreateCustomer(
    organizationId: string,
    email: string,
    name: string
  ): Promise<string> {
    const existingByOrganizationId = await this.stripe.customers.search({
      query: `metadata["organizationId"]:"${organizationId}"`,
      limit: 1,
    });

    if (existingByOrganizationId.data.length > 0) {
      return existingByOrganizationId.data[0].id;
    }

    const existingByEmail = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingByEmail.data.length > 0) {
      const customer = existingByEmail.data[0];
      await this.stripe.customers.update(customer.id, {
        metadata: {
          ...customer.metadata,
          organizationId,
        },
      });
      return customer.id;
    }

    return this.createCustomer({
      email,
      name,
      metadata: { organizationId },
    });
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        return null;
      }
      return customer as Stripe.Customer;
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeError &&
        error.code === "resource_missing"
      ) {
        return null;
      }
      throw error;
    }
  }

  async createSubscription(params: {
    customerId: string;
    priceId: string;
    quantity: number;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<{
    subscriptionId: string;
    clientSecret: string | null;
    status: StripeSubscriptionStatus;
  }> {
    const price = await this.getPrice(params.priceId);
    if (!price) {
      throw new Error(`Price ${params.priceId} not found`);
    }
    const isZeroPrice = price.unit_amount === 0 || price.unit_amount === null;

    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: params.customerId,
      items: [
        {
          price: params.priceId,
          quantity: params.quantity,
        },
      ],
      metadata: params.metadata || {},
      payment_behavior: isZeroPrice
        ? "default_incomplete"
        : "default_incomplete",
      expand: ["latest_invoice", "pending_setup_intent"],
    };

    if (params.trialDays && params.trialDays > 0) {
      subscriptionParams.trial_period_days = params.trialDays;
      subscriptionParams.payment_behavior = "allow_incomplete";
    } else if (isZeroPrice) {
      subscriptionParams.payment_behavior = "allow_incomplete";
    }

    const subscription =
      await this.stripe.subscriptions.create(subscriptionParams);

    let clientSecret: string | null = null;

    if (subscription.status === "incomplete" && subscription.latest_invoice) {
      const invoiceId =
        typeof subscription.latest_invoice === "string"
          ? subscription.latest_invoice
          : subscription.latest_invoice.id;

      const invoice = await this.stripe.invoices.retrieve(invoiceId, {
        expand: ["payment_intent"],
      });

      const paymentIntent = (invoice as ExpandedInvoice).payment_intent;
      if (paymentIntent) {
        const resolvedPaymentIntent =
          typeof paymentIntent === "string"
            ? await this.stripe.paymentIntents.retrieve(paymentIntent)
            : isExpandedPaymentIntent(paymentIntent)
              ? paymentIntent
              : null;

        if (resolvedPaymentIntent) {
          clientSecret = resolvedPaymentIntent.client_secret;
        }
      }
    }

    this.logger.log(
      `Created Stripe subscription: ${subscription.id} (status: ${subscription.status})`
    );

    return {
      subscriptionId: subscription.id,
      clientSecret,
      status: subscription.status as StripeSubscriptionStatus,
    };
  }

  async updateSubscriptionQuantity(
    subscriptionId: string,
    newQuantity: number,
    newPriceId?: string,
    options?: {
      prorationBehavior?: "create_prorations" | "none" | "always_invoice";
      billingCycleAnchor?: "now" | "unchanged";
    }
  ): Promise<StripeSubscription> {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    const itemId = subscription.items.data[0]?.id;
    if (!itemId) {
      throw new Error("Subscription has no items");
    }

    const updateParams: Stripe.SubscriptionUpdateParams = {
      proration_behavior: options?.prorationBehavior || "create_prorations",
      items: [
        {
          id: itemId,
          quantity: newQuantity,
          ...(newPriceId && { price: newPriceId }),
        },
      ],
    };

    if (options?.billingCycleAnchor) {
      updateParams.billing_cycle_anchor = options.billingCycleAnchor;
    }

    const updated = await this.stripe.subscriptions.update(
      subscriptionId,
      updateParams
    );

    this.logger.log(
      `Updated subscription ${subscriptionId} quantity to ${newQuantity}`
    );

    return StripeDomainMapper.toDomainSubscription(updated);
  }

  async cancelSubscription(
    subscriptionId: string,
    immediate: boolean
  ): Promise<Stripe.Subscription> {
    if (immediate) {
      const canceled = await this.stripe.subscriptions.cancel(subscriptionId);
      this.logger.log(`Canceled subscription immediately: ${subscriptionId}`);
      return canceled;
    }

    const updated = await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    this.logger.log(`Scheduled subscription cancellation: ${subscriptionId}`);
    return updated;
  }

  async reactivateSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: false,
      }
    );
    this.logger.log(`Reactivated subscription: ${subscriptionId}`);
    return subscription;
  }

  async getSubscription(
    subscriptionId: string
  ): Promise<StripeSubscription | null> {
    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);
      return StripeDomainMapper.toDomainSubscription(subscription);
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeError &&
        error.code === "resource_missing"
      ) {
        return null;
      }
      throw error;
    }
  }

  async createInvoicePreview(params: {
    customerId: string;
    subscriptionId?: string;
    subscriptionItems?: Array<{
      id?: string;
      price?: string;
      quantity?: number;
    }>;
  }): Promise<Stripe.Invoice> {
    const previewParams: Stripe.InvoiceCreatePreviewParams = {
      customer: params.customerId,
    };

    if (params.subscriptionId) {
      previewParams.subscription = params.subscriptionId;
    }

    if (params.subscriptionItems && params.subscriptionItems.length > 0) {
      previewParams.subscription_details = {
        items: params.subscriptionItems.map((item) => ({
          ...(item.id && { id: item.id }),
          ...(item.price && { price: item.price }),
          ...(item.quantity !== undefined && { quantity: item.quantity }),
        })),
      };
    }

    return this.stripe.invoices.createPreview(previewParams);
  }

  async previewQuantityChange(params: {
    customerId: string;
    subscriptionId: string;
    newQuantity: number;
    newPriceId?: string;
  }): Promise<{
    amountDue: number;
    currency: string;
    prorationAmount: number;
  }> {
    const subscription = await this.stripe.subscriptions.retrieve(
      params.subscriptionId
    );
    const itemId = subscription.items.data[0]?.id;

    if (!itemId) {
      throw new Error("Subscription has no items");
    }

    const preview = await this.createInvoicePreview({
      customerId: params.customerId,
      subscriptionId: params.subscriptionId,
      subscriptionItems: [
        {
          id: itemId,
          quantity: params.newQuantity,
          ...(params.newPriceId && { price: params.newPriceId }),
        },
      ],
    });

    let prorationAmount = 0;
    if (preview.lines?.data) {
      for (const line of preview.lines.data) {
        const expandedLine = line as ExpandedInvoiceLineItem;
        if (expandedLine.proration) {
          prorationAmount += line.amount;
        }
      }
    }

    return {
      amountDue: preview.amount_due,
      currency: preview.currency,
      prorationAmount,
    };
  }

  async getCustomerInvoices(
    customerId: string,
    limit = 10
  ): Promise<Stripe.Invoice[]> {
    const invoices = await this.stripe.invoices.list({
      customer: customerId,
      limit,
    });
    return invoices.data;
  }

  async getInvoice(invoiceId: string): Promise<StripeInvoice | null> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      return StripeDomainMapper.toDomainInvoice(invoice);
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeError &&
        error.code === "resource_missing"
      ) {
        return null;
      }
      throw error;
    }
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>(
      "stripe.webhookSecret"
    );
    if (!webhookSecret) {
      throw new Error(
        "STRIPE_WEBHOOK_SECRET is required for webhook verification"
      );
    }

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  }

  async getPaymentMethod(
    paymentMethodId: string
  ): Promise<StripePaymentMethod | null> {
    try {
      const paymentMethod =
        await this.stripe.paymentMethods.retrieve(paymentMethodId);
      return StripeDomainMapper.toDomainPaymentMethod(paymentMethod);
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeError &&
        error.code === "resource_missing"
      ) {
        return null;
      }
      throw error;
    }
  }

  async getPrice(priceId: string): Promise<StripePrice | null> {
    try {
      const price = await this.stripe.prices.retrieve(priceId);
      return StripeDomainMapper.toDomainPrice(price);
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeError &&
        error.code === "resource_missing"
      ) {
        return null;
      }
      throw error;
    }
  }

  async createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });

    this.logger.log(
      `Created billing portal session for customer: ${params.customerId}`
    );

    return session.url;
  }

  async createPaymentIntent(params: {
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
  }> {
    let invoiceId: string | undefined;

    if (params.createInvoice) {
      const invoice = await this.stripe.invoices.create({
        customer: params.customerId,
        currency: params.currency || "eur",
        description: params.description || "Quantity update payment",
        metadata: params.metadata || {},
        auto_advance: false,
      });

      await this.stripe.invoiceItems.create({
        customer: params.customerId,
        invoice: invoice.id,
        amount: params.amountCents,
        currency: params.currency || "eur",
        description: params.description || "Quantity update payment",
      });

      const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(
        invoice.id
      );

      invoiceId = finalizedInvoice.id;

      let paymentIntentId: string;
      let clientSecret: string | null = null;

      const paymentIntent = (finalizedInvoice as ExpandedInvoice)
        .payment_intent;
      if (paymentIntent) {
        const paymentIntentIdStr =
          typeof paymentIntent === "string"
            ? paymentIntent
            : isExpandedPaymentIntent(paymentIntent)
              ? paymentIntent.id
              : null;

        if (paymentIntentIdStr) {
          const resolvedPaymentIntent =
            await this.stripe.paymentIntents.retrieve(paymentIntentIdStr);

          paymentIntentId = resolvedPaymentIntent.id;
          clientSecret = resolvedPaymentIntent.client_secret;

          if (params.metadata && Object.keys(params.metadata).length > 0) {
            await this.stripe.paymentIntents.update(paymentIntentId, {
              metadata: {
                ...resolvedPaymentIntent.metadata,
                ...params.metadata,
                invoiceId: invoiceId,
              },
            });
          }
        } else {
          // If paymentIntent exists but we can't resolve it, create a new one
          const newPaymentIntent = await this.stripe.paymentIntents.create({
            amount: params.amountCents,
            currency: params.currency || "eur",
            customer: params.customerId,
            metadata: {
              ...params.metadata,
              invoiceId: invoiceId,
            },
            automatic_payment_methods: {
              enabled: true,
            },
          });

          paymentIntentId = newPaymentIntent.id;
          clientSecret = newPaymentIntent.client_secret;
        }
      } else {
        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: params.amountCents,
          currency: params.currency || "eur",
          customer: params.customerId,
          metadata: {
            ...params.metadata,
            invoiceId: invoiceId,
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        paymentIntentId = paymentIntent.id;
        clientSecret = paymentIntent.client_secret;
      }

      if (!clientSecret) {
        throw new Error("PaymentIntent created without client_secret");
      }

      this.logger.log(
        `Created payment intent ${paymentIntentId} with invoice ${invoiceId} for customer ${params.customerId}, amount: ${params.amountCents} cents`
      );

      return {
        paymentIntentId,
        clientSecret,
        invoiceId,
      };
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: params.amountCents,
      currency: params.currency || "eur",
      customer: params.customerId,
      metadata: params.metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    this.logger.log(
      `Created payment intent ${paymentIntent.id} for customer ${params.customerId}, amount: ${params.amountCents} cents`
    );

    if (!paymentIntent.client_secret) {
      throw new Error("PaymentIntent created without client_secret");
    }

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  }
}
