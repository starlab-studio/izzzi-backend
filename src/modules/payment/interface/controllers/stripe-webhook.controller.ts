import {
  Controller,
  Post,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
  Inject,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { BaseController } from "src/core";
import type { IStripeSyncService } from "../../domain/services/stripe-sync.service";
import { STRIPE_SYNC_SERVICE } from "../../domain/services/stripe-sync.service";
import { HandleStripeWebhookUseCase } from "../../application/use-cases/HandleStripeWebhook.use-case";
import { WebhookEventMapper } from "../../infrastructure/mappers/webhook-event.mapper";
import Stripe from "stripe";

@ApiTags("webhooks")
@Controller("v1/webhooks")
export class StripeWebhookController extends BaseController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    @Inject(STRIPE_SYNC_SERVICE)
    private readonly stripeSyncService: IStripeSyncService,
    private readonly handleStripeWebhookUseCase: HandleStripeWebhookUseCase
  ) {
    super();
  }

  @Post("stripe")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Webhook endpoint pour recevoir les événements Stripe",
    description:
      "Cet endpoint reçoit les événements Stripe et les route vers le use-case approprié. La vérification de la signature est effectuée automatiquement.",
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
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : typeof req.body === "string"
          ? Buffer.from(req.body)
          : Buffer.from(JSON.stringify(req.body));

      const stripeEvent = this.stripeSyncService.constructWebhookEvent(
        rawBody,
        signature
      );

      this.logger.log(
        `Received Stripe event: ${stripeEvent.type} (id: ${stripeEvent.id})`
      );

      const domainEvent = WebhookEventMapper.toDomainEvent(stripeEvent);

      await this.handleStripeWebhookUseCase.execute({ event: domainEvent });

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

      return res.status(HttpStatus.OK).json({
        received: true,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
