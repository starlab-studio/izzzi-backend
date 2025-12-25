import { Injectable, Logger } from "@nestjs/common";
import Stripe from "stripe";
import { SyncInvoiceFromStripeUseCase } from "../../../subscription/application/use-cases/SyncInvoiceFromStripe.use-case";

@Injectable()
export class InvoicePaidHandler {
  private readonly logger = new Logger(InvoicePaidHandler.name);

  constructor(
    private readonly syncInvoiceFromStripeUseCase: SyncInvoiceFromStripeUseCase
  ) {}

  async handle(stripeInvoice: Stripe.Invoice): Promise<void> {
    try {
      this.logger.log(
        `Processing invoice.paid event for invoice ${stripeInvoice.id}`
      );

      await this.syncInvoiceFromStripeUseCase.execute({
        stripeInvoice,
      });

      this.logger.log(
        `Successfully processed invoice.paid event for invoice ${stripeInvoice.id}`
      );
    } catch (error) {
      this.logger.error(
        `Error processing invoice.paid event: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}
