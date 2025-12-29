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
    private readonly stripeSyncService: IStripeSyncService
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

    // Retrieve the full Stripe invoice via the domain service
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

    if (webhookPaymentIntent.metadata?.subscriptionId) {
      const subscriptionId = webhookPaymentIntent.metadata.subscriptionId;
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

    this.logger.info(
      `Successfully processed payment_intent.succeeded event for payment intent ${webhookPaymentIntent.id}`
    );
  }

  private async handleSubscriptionUpdated(
    webhookSubscription: IWebhookSubscription
  ): Promise<void> {
    this.logger.info(
      `Processing customer.subscription.updated event for subscription ${webhookSubscription.id}`
    );

    // Retrieve the full Stripe subscription via the domain service
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

    // Retrieve the full Stripe subscription via the domain service
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
