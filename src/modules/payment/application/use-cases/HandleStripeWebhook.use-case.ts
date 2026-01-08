import { BaseUseCase, IUseCase } from "src/core";
import type { ILoggerService } from "src/core";
import type { IStripeSyncService } from "../../domain/services/stripe-sync.service";
import { SyncInvoiceFromStripeUseCase } from "../../../subscription/application/use-cases/SyncInvoiceFromStripe.use-case";
import { SyncSubscriptionFromStripeUseCase } from "../../../subscription/application/use-cases/SyncSubscriptionFromStripe.use-case";
import type {
  IWebhookEvent,
  IWebhookInvoice,
  IWebhookPaymentIntent,
  IWebhookSubscription,
} from "../../domain/types/webhook-event.types";
import type { ISubscriptionRepository } from "../../../subscription/domain/repositories/subscription.repository";
import type { IPricingTierRepository } from "../../../subscription/domain/repositories/pricing-tier.repository";
import type { IInvoiceRepository } from "../../../subscription/domain/repositories/invoice.repository";

export interface HandleStripeWebhookInput {
  event: IWebhookEvent;
}

export interface HandleStripeWebhookOutput {
  processed: boolean;
  eventType: string;
}

export class HandleStripeWebhookUseCase
  extends BaseUseCase
  implements IUseCase<HandleStripeWebhookInput, HandleStripeWebhookOutput>
{
  constructor(
    logger: ILoggerService,
    private readonly syncInvoiceFromStripeUseCase: SyncInvoiceFromStripeUseCase,
    private readonly syncSubscriptionFromStripeUseCase: SyncSubscriptionFromStripeUseCase,
    private readonly stripeSyncService: IStripeSyncService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly pricingTierRepository: IPricingTierRepository,
    private readonly invoiceRepository: IInvoiceRepository
  ) {
    super(logger);
  }

  async execute(
    input: HandleStripeWebhookInput
  ): Promise<HandleStripeWebhookOutput> {
    const { event } = input;

    try {
      this.logger.info(
        `Processing Stripe webhook event: ${event.type} (id: ${event.id})`
      );

      switch (event.type) {
        case "invoice.paid":
          await this.handleInvoicePaid(event.data.object as IWebhookInvoice);
          break;

        case "payment_intent.succeeded":
          await this.handlePaymentIntentSucceeded(
            event.data.object as IWebhookPaymentIntent
          );
          break;

        case "payment_intent.failed":
          await this.handlePaymentIntentFailed(
            event.data.object as IWebhookPaymentIntent
          );
          break;

        case "payment_intent.canceled":
          await this.handlePaymentIntentCanceled(
            event.data.object as IWebhookPaymentIntent
          );
          break;

        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(
            event.data.object as IWebhookSubscription
          );
          break;

        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(
            event.data.object as IWebhookSubscription
          );
          break;

        default:
          this.logger.info(`Unhandled event type: ${event.type}`);
          return { processed: false, eventType: event.type };
      }

      this.logger.info(
        `Successfully processed Stripe webhook event: ${event.type} (id: ${event.id})`
      );

      return { processed: true, eventType: event.type };
    } catch (error) {
      this.logger.error(
        `Error processing Stripe webhook event ${event.type}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack || "" : ""
      );
      return { processed: false, eventType: event.type };
    }
  }

  async withCompensation(): Promise<void> {
    // Pas de compensation nécessaire pour les webhooks
  }

  private async handleInvoicePaid(
    webhookInvoice: IWebhookInvoice
  ): Promise<void> {
    this.logger.info(
      `Processing invoice.paid event for invoice ${webhookInvoice.id}`
    );

    const stripeInvoice = await this.stripeSyncService.getInvoice(
      webhookInvoice.id
    );

    if (!stripeInvoice) {
      this.logger.error(`Invoice ${webhookInvoice.id} not found in Stripe`, "");
      return;
    }

    await this.syncInvoiceFromStripeUseCase.execute({
      stripeInvoice,
    });

    this.logger.info(
      `Successfully processed invoice.paid event for invoice ${webhookInvoice.id}`
    );
  }

  private async handlePaymentIntentSucceeded(
    webhookPaymentIntent: IWebhookPaymentIntent
  ): Promise<void> {
    this.logger.info(
      `Processing payment_intent.succeeded event for payment intent ${webhookPaymentIntent.id}`
    );

    if (webhookPaymentIntent.invoice) {
      const invoiceId =
        typeof webhookPaymentIntent.invoice === "string"
          ? webhookPaymentIntent.invoice
          : webhookPaymentIntent.invoice.id;

      const existingInvoice =
        await this.invoiceRepository.findByStripeInvoiceId(invoiceId);

      if (existingInvoice && existingInvoice.status === "paid") {
        this.logger.warn(
          `Payment intent ${webhookPaymentIntent.id} already processed (invoice ${invoiceId} is already paid), skipping`
        );
        return;
      }
    }

    if (webhookPaymentIntent.invoice) {
      const invoiceId =
        typeof webhookPaymentIntent.invoice === "string"
          ? webhookPaymentIntent.invoice
          : webhookPaymentIntent.invoice.id;

      try {
        const stripeInvoice =
          await this.stripeSyncService.getInvoice(invoiceId);
        if (stripeInvoice) {
          await this.syncInvoiceFromStripeUseCase.execute({
            stripeInvoice,
          });
          this.logger.info(
            `Synchronized invoice ${invoiceId} from payment intent ${webhookPaymentIntent.id}`
          );
        }
      } catch (invoiceError) {
        this.logger.error(
          `Failed to sync invoice ${invoiceId} from payment intent ${webhookPaymentIntent.id}: ${
            invoiceError instanceof Error
              ? invoiceError.message
              : String(invoiceError)
          }`,
          invoiceError instanceof Error ? invoiceError.stack || "" : ""
        );
      }
    }

    const metadata = webhookPaymentIntent.metadata || {};

    if (metadata.subscriptionId) {
      const subscriptionId = metadata.subscriptionId;
      try {
        const stripeSubscription =
          await this.stripeSyncService.getSubscription(subscriptionId);

        if (stripeSubscription) {
          await this.syncSubscriptionFromStripeUseCase.execute({
            stripeSubscription,
          });
          this.logger.info(
            `Synchronized subscription ${subscriptionId} from payment intent ${webhookPaymentIntent.id}`
          );
        }
      } catch (subscriptionError) {
        this.logger.error(
          `Failed to sync subscription ${subscriptionId} from payment intent ${webhookPaymentIntent.id}: ${
            subscriptionError instanceof Error
              ? subscriptionError.message
              : String(subscriptionError)
          }`,
          subscriptionError instanceof Error
            ? subscriptionError.stack || ""
            : ""
        );
      }
    }

    if (metadata.type === "quantity_update" && metadata.subscriptionId) {
      await this.handleQuantityUpdateAfterPayment(webhookPaymentIntent);
    }

    this.logger.info(
      `Successfully processed payment_intent.succeeded event for payment intent ${webhookPaymentIntent.id}`
    );
  }

  private async handleQuantityUpdateAfterPayment(
    webhookPaymentIntent: IWebhookPaymentIntent
  ): Promise<void> {
    const metadata = webhookPaymentIntent.metadata || {};
    const subscriptionId = metadata.subscriptionId;
    const newQuantityStr = metadata.newQuantity;

    if (!subscriptionId || !newQuantityStr) {
      this.logger.warn(
        `Quantity update payment_intent.succeeded ${webhookPaymentIntent.id} missing subscriptionId or newQuantity in metadata`
      );
      return;
    }

    const newQuantity = Number(newQuantityStr);
    if (!Number.isInteger(newQuantity) || newQuantity < 1 || newQuantity > 20) {
      this.logger.warn(
        `Invalid newQuantity "${newQuantityStr}" in quantity_update metadata for payment intent ${webhookPaymentIntent.id}`
      );
      return;
    }

    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      this.logger.error(
        `Subscription ${subscriptionId} not found while handling quantity_update for payment intent ${webhookPaymentIntent.id}`,
        ""
      );
      return;
    }

    if (!subscription.stripeSubscriptionId) {
      this.logger.error(
        `Subscription ${subscription.id} has no stripeSubscriptionId while handling quantity_update for payment intent ${webhookPaymentIntent.id}`,
        ""
      );
      return;
    }

    const tiers = await this.pricingTierRepository.findByPlanIdAndBillingPeriod(
      subscription.planId,
      subscription.billingPeriod
    );
    const newTier = tiers.find(
      (t) => newQuantity >= t.minClasses && newQuantity <= t.maxClasses
    );

    if (!newTier || !newTier.stripePriceId) {
      this.logger.error(
        `No pricing tier with stripePriceId found for plan ${subscription.planId}, billingPeriod ${subscription.billingPeriod}, quantity ${newQuantity} while handling quantity_update for payment intent ${webhookPaymentIntent.id}`,
        ""
      );
      return;
    }

    await this.stripeSyncService.updateSubscriptionQuantity(
      subscription.stripeSubscriptionId,
      newQuantity,
      newTier.stripePriceId,
      {
        prorationBehavior: "none",
        billingCycleAnchor: "unchanged",
      }
    );

    try {
      subscription.updateQuantity(newQuantity, true);
      await this.subscriptionRepository.save(subscription);
      this.logger.info(
        `Applied quantity_update to subscription ${subscription.id} (new quantity: ${newQuantity}) after payment intent ${webhookPaymentIntent.id}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to update local subscription ${subscription.id} quantity after payment intent ${webhookPaymentIntent.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack || "" : ""
      );
    }
  }

  private async handlePaymentIntentFailed(
    webhookPaymentIntent: IWebhookPaymentIntent
  ): Promise<void> {
    this.logger.info(
      `Processing payment_intent.failed event for payment intent ${webhookPaymentIntent.id}`
    );

    const metadata = webhookPaymentIntent.metadata || {};
    if (metadata.type === "quantity_update" && metadata.subscriptionId) {
      await this.handleQuantityUpdatePaymentFailed(webhookPaymentIntent);
    }

    this.logger.info(
      `Successfully processed payment_intent.failed event for payment intent ${webhookPaymentIntent.id}`
    );
  }

  private async handlePaymentIntentCanceled(
    webhookPaymentIntent: IWebhookPaymentIntent
  ): Promise<void> {
    this.logger.info(
      `Processing payment_intent.canceled event for payment intent ${webhookPaymentIntent.id}`
    );

    const metadata = webhookPaymentIntent.metadata || {};
    if (metadata.type === "quantity_update" && metadata.subscriptionId) {
      await this.handleQuantityUpdatePaymentFailed(webhookPaymentIntent);
    }

    this.logger.info(
      `Successfully processed payment_intent.canceled event for payment intent ${webhookPaymentIntent.id}`
    );
  }

  private async handleQuantityUpdatePaymentFailed(
    webhookPaymentIntent: IWebhookPaymentIntent
  ): Promise<void> {
    this.logger.info(
      `Quantity update payment intent ${webhookPaymentIntent.id} failed or was canceled. No subscription quantity change has been applied.`
    );
  }

  private async handleSubscriptionUpdated(
    webhookSubscription: IWebhookSubscription
  ): Promise<void> {
    this.logger.info(
      `Processing customer.subscription.updated event for subscription ${webhookSubscription.id}`
    );

    const stripeSubscription = await this.stripeSyncService.getSubscription(
      webhookSubscription.id
    );

    if (!stripeSubscription) {
      this.logger.error(
        `Subscription ${webhookSubscription.id} not found in Stripe`,
        ""
      );
      return;
    }

    await this.syncSubscriptionFromStripeUseCase.execute({
      stripeSubscription,
    });

    this.logger.info(
      `Successfully processed customer.subscription.updated event for subscription ${webhookSubscription.id}`
    );
  }

  private async handleSubscriptionDeleted(
    webhookSubscription: IWebhookSubscription
  ): Promise<void> {
    this.logger.info(
      `Processing customer.subscription.deleted event for subscription ${webhookSubscription.id}`
    );

    const stripeSubscription = await this.stripeSyncService.getSubscription(
      webhookSubscription.id
    );

    if (!stripeSubscription) {
      this.logger.error(
        `Subscription ${webhookSubscription.id} not found in Stripe`,
        ""
      );
      return;
    }

    await this.syncSubscriptionFromStripeUseCase.execute({
      stripeSubscription,
    });

    this.logger.info(
      `Successfully processed customer.subscription.deleted event for subscription ${webhookSubscription.id}`
    );
  }
}
