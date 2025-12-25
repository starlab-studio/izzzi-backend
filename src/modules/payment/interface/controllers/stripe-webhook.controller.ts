import {
  Controller,
  Post,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { BaseController } from "src/core";
import { StripeSyncService } from "../../infrastructure/services/stripe-sync.service";
import { InvoicePaidHandler } from "../../application/handlers/invoice-paid.handler";
import { PaymentIntentSucceededHandler } from "../../application/handlers/payment-intent-succeeded.handler";
import { SubscriptionUpdatedHandler } from "../../application/handlers/subscription-updated.handler";
import { SubscriptionDeletedHandler } from "../../application/handlers/subscription-deleted.handler";
import Stripe from "stripe";

@ApiTags("webhooks")
@Controller("v1/webhooks")
export class StripeWebhookController extends BaseController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeSyncService: StripeSyncService,
    private readonly invoicePaidHandler: InvoicePaidHandler,
    private readonly paymentIntentSucceededHandler: PaymentIntentSucceededHandler,
    private readonly subscriptionUpdatedHandler: SubscriptionUpdatedHandler,
    private readonly subscriptionDeletedHandler: SubscriptionDeletedHandler
  ) {
    super();
  }

  @Post("stripe")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Webhook endpoint pour recevoir les événements Stripe",
    description:
      "Cet endpoint reçoit les événements Stripe et les route vers les handlers appropriés. La vérification de la signature est effectuée automatiquement.",
  })
  @ApiResponse({
    status: 200,
    description: "Événement traité avec succès",
  })
  @ApiResponse({
    status: 400,
    description: "Signature invalide ou événement non reconnu",
  })
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      this.logger.warn("Webhook request missing stripe-signature header");
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: "Missing stripe-signature header",
      });
    }

    try {
      // req.body should be a Buffer for Stripe webhook verification
      // The raw body middleware should have set this
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : typeof req.body === "string"
          ? Buffer.from(req.body)
          : Buffer.from(JSON.stringify(req.body));

      const event = this.stripeSyncService.constructWebhookEvent(
        rawBody,
        signature
      );

      this.logger.log(`Received Stripe event: ${event.type} (id: ${event.id})`);

      // Route l'événement vers le handler approprié
      switch (event.type) {
        case "invoice.paid":
          await this.invoicePaidHandler.handle(
            event.data.object as Stripe.Invoice
          );
          break;

        case "payment_intent.succeeded":
          await this.paymentIntentSucceededHandler.handle(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case "customer.subscription.updated":
          await this.subscriptionUpdatedHandler.handle(
            event.data.object as Stripe.Subscription
          );
          break;

        case "customer.subscription.deleted":
          await this.subscriptionDeletedHandler.handle(
            event.data.object as Stripe.Subscription
          );
          break;

        default:
          this.logger.debug(`Unhandled event type: ${event.type}`);
      }

      return res.status(HttpStatus.OK).json({ received: true });
    } catch (error) {
      this.logger.error(
        `Webhook error: ${error instanceof Error ? error.message : String(error)}`
      );

      if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: "Invalid signature",
        });
      }

      // Retourner 200 même en cas d'erreur pour éviter les retries Stripe
      // (sauf pour les erreurs de signature)
      return res.status(HttpStatus.OK).json({
        received: true,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
